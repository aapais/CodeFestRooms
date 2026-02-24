/**
 * Firebase Functions - High-Fidelity Validation with Real ESLint
 */

const functions = require('firebase-functions');

exports.api = functions.https.onRequest(async (req, res) => {
  const admin = require('firebase-admin');
  const express = require('express');
  const cors = require('cors');
  const vm = require('vm');
  const { Linter } = require('eslint');

  if (!admin.apps.length) admin.initializeApp();
  const db = admin.firestore();
  const linter = new Linter();

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

  app.post('/api/team/update', async (req, res) => {
    try {
      const { name, token, sourceCode, completedRoom, serverCode } = req.body;
      const teamRef = db.collection('teams').doc(name);
      const doc = await teamRef.get();
      if (!doc.exists) return res.status(404).json({ ok: false });
      const team = doc.data();
      if (team.token !== token) return res.status(403).json({ ok: false });

      if (completedRoom) {
        let vRes = { ok: true };
        const sandbox = { module: { exports: {} }, exports: {}, console: { log: () => {} }, Date, Math, Number, String, JSON, Array, Error, require: (m) => m === 'crypto' ? require('crypto') : {}, process: { argv: [], exit: () => {} } };
        vm.createContext(sandbox);

        if (completedRoom === 'room1') {
          vm.runInContext(sourceCode, sandbox, { timeout: 1000 });
          const fn = sandbox.module.exports.placeOrder || sandbox.placeOrder;
          const r = fn('t', { items: [{ priceCents: 1000, qty: 5 }], discountCode: 'WELCOME10' });
          if (r?.order?.amounts?.taxCents !== 1139) vRes = { ok: false, error: "IVA incorreto." };
        } else if (completedRoom === 'room2') {
          // 1. Validar Lógica
          vm.runInContext(sourceCode, sandbox, { timeout: 1000 });
          const engine = new sandbox.module.exports.InvoiceEngine();
          const r = engine.generateInvoice({ items: [{ sku: 'T', unitPrice: 100, qty: 2 }] }, { tier: 'VIP' });
          if (!r?.ok || r.amounts?.total !== 246) {
            vRes = { ok: false, error: "Integrity Failed: A lógica matemática foi quebrada." };
          } else {
            // 2. Validar Complexidade com ESLint REAL
            const msgs = linter.verify(sourceCode, {
              languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
              rules: { complexity: ['error', 1] }
            });
            let max = 0;
            msgs.forEach(m => {
              const match = m.message.match(/complexity of (\d+)/);
              if (match) max = Math.max(max, parseInt(match[1]));
            });
            vRes.complexity = max;
            if (max > 10) vRes = { ok: false, error: `Complexidade de ${max} detetada. O limite é 10.` };
          }
        } else if (completedRoom === 'room3') {
          if (sourceCode.includes(" + password") || !sourceCode.includes("?")) vRes = { ok: false, error: "Brecha de segurança ativa." };
          else vRes.bonus = sourceCode.includes('bcrypt') || sourceCode.includes('.hash');
        } else if (completedRoom === 'final') {
          vm.runInContext(sourceCode, sandbox, { timeout: 1000 });
          const svc = sandbox.module.exports.calcScore || sandbox.exports.calcScore || sandbox.calcScore;
          const r1 = svc({ age: 30, country: 'PT', spends: [100] });
          const r2 = svc({ age: 30, country: 'PT', spends: [6000] });
          if (r1.score !== 17 || r2.score !== 50) vRes = { ok: false, error: "Lógica High Roller incorreta." };
        }

        if (!vRes.ok) return res.json({ ok: false, error: vRes.error });

        const updates = { updatedAt: Date.now() };
        let newPts = 0;
        if (!(team.completedRooms || []).includes(completedRoom)) {
          newPts += ROOM_POINTS[completedRoom];
          updates.completedRooms = [...(team.completedRooms || []), completedRoom];
        }
        
        let bVal = 0;
        if (completedRoom === 'room1' && (sourceCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length >= 3) bVal = 50;
        if (completedRoom === 'room2' && vRes.complexity < 5) bVal = 75; // Limite original restaurado!
        if (completedRoom === 'room3' && vRes.bonus) bVal = 100;
        if (completedRoom === 'final' && serverCode?.includes("get('/health'")) bVal = 50;

        const oldB = team.bonusMap?.[completedRoom] || 0;
        if (bVal > oldB) { newPts += (bVal - oldB); if(!updates.bonusMap) updates.bonusMap = team.bonusMap || {}; updates.bonusMap[completedRoom] = bVal; }
        if (newPts > 0) { updates.score = (team.score || 0) + newPts; updates.lastResult = `✅ Missão ${completedRoom} Atualizada`; }
        await teamRef.update(updates);
      }
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get(['/state', '/api/state'], async (req, res) => {
    const snp = await db.collection('teams').get();
    const teams = []; snp.forEach(doc => teams.push(doc.data()));
    teams.sort((a,b) => (b.score - a.score) || (a.updatedAt - b.updatedAt));
    res.json({ ok: true, teams });
  });

  app.get(['/timer', '/api/timer'], async (req, res) => {
    const doc = await db.collection('gameState').doc('timer').get();
    res.json({ ok: true, timer: doc.exists ? doc.data() : null });
  });

  app.post(['/kickoff', '/api/kickoff'], async (req, res) => {
    const startTime = Date.now();
    await db.collection('gameState').doc('timer').set({ startTime, duration: 50*60*1000 });
    res.json({ ok: true, startTime });
  });

  app.post(['/reset', '/api/reset'], async (req, res) => {
    await db.collection('gameState').doc('timer').delete();
    if (req.body?.clearTeams) {
      const snp = await db.collection('teams').get();
      const batch = db.batch(); snp.forEach(d => batch.delete(d.ref)); await batch.commit();
    }
    res.json({ ok: true });
  });

  return app(req, res);
});
