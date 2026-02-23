/**
 * Firebase Functions - Final Bonus Flexibility Fix
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const vm = require('vm');
const crypto = require('crypto');
const { Linter } = require('eslint');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const linter = new Linter();
const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

// --- VALIDATORS ---
function validateRoom1(src) {
  try {
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console: { log: () => {} }, Date, Math, Number, String, JSON };
    vm.createContext(sandbox); vm.runInContext(src, sandbox);
    const svc = sandbox.module.exports; svc.createUser('V', 'P'); const auth = svc.authenticate('V', 'P');
    const res = svc.placeOrder(auth.token, { items: [{ priceCents: 1000, qty: 5 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } });
    if (res?.order?.amounts?.taxCents === 1139) return { ok: true };
    return { ok: false, error: "IVA incorreto." };
  } catch (e) { return { ok: false, error: "Erro Room 1." }; }
}

function validateRoom2(src) {
  try {
    const sandbox = { module: { exports: {} }, console: { log: () => {} }, Math, Number, String, JSON, Array };
    vm.createContext(sandbox); vm.runInContext(src, sandbox);
    const engine = new sandbox.module.exports.InvoiceEngine();
    const res = engine.generateInvoice({ items: [{ sku: 'T', unitPrice: 100, qty: 2 }] }, { tier: 'VIP' });
    if (!res?.ok) return { ok: false, error: "Lógica Room 2 partida." };
    const msgs = linter.verify(src, { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' }, rules: { complexity: ['error', 1] } });
    let max = 0; msgs.forEach(m => { const v = m.message.match(/complexity of (\d+)/); if (v) max = Math.max(max, parseInt(v[1])); });
    if (max > 10) return { ok: false, error: `Complexidade ${max} > 10.` };
    return { ok: true, complexity: max };
  } catch (e) { return { ok: false, error: "Erro Room 2." }; }
}

function validateRoom3(src) {
  if (src.includes(" + ") || !src.includes("?")) return { ok: false, error: "Vulnerabilidade detetada." };
  return { ok: true, bonus: src.includes('bcrypt') || src.includes('.hash') };
}

function validateFinal(src) {
  try {
    const sandbox = { module: { exports: {} }, exports: {}, console: { log: () => {} }, Date, Math, Number, String, JSON, Array, process: { argv: [], exit: () => {} }, require: () => ({}) };
    vm.createContext(sandbox); vm.runInContext(src, sandbox);
    const svc = sandbox.module.exports.calcScore ? sandbox.module.exports : sandbox.exports;
    const res1 = svc.calcScore({ age: 30, country: 'PT', spends: [100] });
    const res2 = svc.calcScore({ age: 30, country: 'PT', spends: [6000] });
    
    // Regra High Roller: se gasto > 5000 -> score 50 fixo
    if (res1.score === 17 && res2.score === 50) {
      // BONUS: Aceita tanto rota real como padrão de código
      const hasHealth = src.includes('/health') || src.includes('uptime') || src.includes('healthCheck');
      return { ok: true, bonus: hasHealth };
    }
    return { ok: false, error: "Regra High Roller (> 5000€) incorreta." };
  } catch (e) { return { ok: false, error: "Erro no Monólito: " + e.message }; }
}

// --- API ---

app.get(['/state', '/api/state'], async (req, res) => {
  const snp = await db.collection('teams').get();
  const teams = []; snp.forEach(doc => teams.push(doc.data()));
  teams.sort((a, b) => (b.score - a.score) || (a.updatedAt - b.updatedAt));
  res.json({ ok: true, teams });
});

app.post(['/team/login', '/api/team/login'], async (req, res) => {
  const name = String(req.body.name || 'Team').trim().slice(0, 20);
  const teamRef = db.collection('teams').doc(name);
  const doc = await teamRef.get();
  let team = doc.exists ? doc.data() : { name, token: Math.random().toString(36).slice(2), score: 0, completedRooms: [], bonusMap: {}, updatedAt: Date.now() };
  if (!doc.exists) await teamRef.set(team);
  res.json({ ok: true, team });
});

app.post(['/team/update', '/api/team/update'], async (req, res) => {
  const { name, token, sourceCode, completedRoom } = req.body;
  const teamRef = db.collection('teams').doc(name);
  const doc = await teamRef.get();
  if (!doc.exists) return res.status(404).json({ ok: false });
  const team = doc.data();
  if (team.token !== token) return res.status(403).json({ ok: false });

  if (completedRoom) {
    let v = { ok: true };
    const { serverCode } = req.body; // New field for Room 4

    if (completedRoom === 'room1') v = validateRoom1(sourceCode);
    if (completedRoom === 'room2') v = validateRoom2(sourceCode);
    if (completedRoom === 'room3') v = validateRoom3(sourceCode);
    if (completedRoom === 'final') v = validateFinal(sourceCode);
    
    if (!v.ok) return res.json({ ok: false, error: v.error });

    const alreadyDone = (team.completedRooms || []).includes(completedRoom);
    const updates = { updatedAt: Date.now() };
    const bonusMap = team.bonusMap || {};
    let newPoints = 0;

    if (!alreadyDone) {
      newPoints += ROOM_POINTS[completedRoom];
      updates.completedRooms = [...(team.completedRooms || []), completedRoom];
    }

    let bonusValue = 0;
    if (completedRoom === 'room1') bonusValue = (sourceCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length >= 3 ? 50 : 0;
    if (completedRoom === 'room2') bonusValue = v.complexity < 5 ? 75 : 0;
    if (completedRoom === 'room3') bonusValue = v.bonus ? 100 : 0;
    if (completedRoom === 'final') {
      // BONUS: Real route implementation check in server.js
      const hasHealthRoute = serverCode && (
        serverCode.includes("app.get('/health'") || 
        serverCode.includes('app.get("/health"') ||
        (serverCode.includes('/health') && serverCode.includes('res.status(200)'))
      );
      bonusValue = hasHealthRoute ? 50 : 0;
    }

    const oldBonus = bonusMap[completedRoom] || 0;
    if (bonusValue > oldBonus) {
      newPoints += (bonusValue - oldBonus);
      bonusMap[completedRoom] = bonusValue;
      updates.bonusMap = bonusMap;
    }

    if (newPoints > 0) {
      updates.score = (team.score || 0) + newPoints;
      updates.lastResult = `✅ Sala ${completedRoom} completa!`;
    }

    await teamRef.update(updates);
  }
  res.json({ ok: true });
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
  if (req.body && req.body.clearTeams) {
    const snp = await db.collection('teams').get();
    const batch = db.batch(); snp.forEach(d => batch.delete(d.ref)); await batch.commit();
  }
  res.json({ ok: true });
});

exports.api = functions.https.onRequest(app);
