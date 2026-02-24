const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const vm = require('vm');
const acorn = require('acorn');
const walk = require('acorn-walk');

if (!admin.apps.length) { admin.initializeApp(); }
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
const db = admin.firestore();
const TIMER_DOC = 'settings/game_timer';

function validateRoomCode(roomId, sourceCode) {
  if (!sourceCode) return { ok: false, error: "Código vazio." };

  try {
    const sandbox = { module: { exports: {} }, exports: {}, console, Date, Math, Number, String, JSON, Array, Object, Error, require: (m) => m === 'crypto' ? require('crypto') : {} };
    vm.createContext(sandbox);
    vm.runInContext(sourceCode, sandbox, { timeout: 2000 });
    const svc = sandbox.module.exports || sandbox.exports || sandbox;

    if (roomId === 'room1') {
      const res = svc.placeOrder("token", { items: [{ priceCents: 100000, qty: 2 }], discountCode: 'WELCOME10' });
      const a = res.order.amounts;
      const expectedTax = 41504;
      if (a.taxCents !== expectedTax) return { ok: false, error: `IVA incorreto.` };
      const jsDocMatches = sourceCode.match(/\/\*\*[\s\S]*?\*\//g) || [];
      const bonus = jsDocMatches.length >= 3 ? 50 : 0;
      return { ok: true, points: 100, bonus };
    }

    if (roomId === 'room2') {
      const Engine = svc.InvoiceEngine || svc;
      const engine = new Engine();
      engine.generateInvoice({ items: [{ sku: 'A', unitPrice: 10, qty: 1 }] }, { tier: 'VIP' });
      
      // ANÁLISE DE COMPLEXIDADE VIA AST (ACORN)
      const tree = acorn.parse(sourceCode, { ecmaVersion: 2022, sourceType: 'script' });
      let complexity = 1;
      walk.simple(tree, {
        IfStatement() { complexity++; },
        ForStatement() { complexity++; },
        WhileStatement() { complexity++; },
        DoWhileStatement() { complexity++; },
        SwitchCase(node) { if (node.test) complexity++; },
        LogicalExpression(node) { if (node.operator === '&&' || node.operator === '||') complexity++; },
        ConditionalExpression() { complexity++; }
      });

      if (complexity > 10) return { ok: false, error: `Complexidade ${complexity} acima do limite.` };
      const bonus = complexity < 5 ? 75 : 0;
      return { ok: true, points: 150, bonus };
    }

    if (roomId === 'room3') {
      if (/['"`]\s*\+\s*\w+|\w+\s*\+\s*['"`]/.test(sourceCode)) return { ok: false, error: "SQL Injection detetada." };
      return { ok: true, points: 150, bonus: 0 };
    }

    if (roomId === 'final') {
      const calc = svc.calcScore || svc;
      if (calc({ age: 30, spends: [6000] }).score !== 50) return { ok: false, error: "Elite Policy falhou." };
      return { ok: true, points: 200, bonus: 0 };
    }
    return { ok: false, error: "Sala inválida." };
  } catch (e) { return { ok: false, error: "Erro de Análise: " + e.message }; }
}

const router = express.Router();
router.get('/timer', async (req, res) => {
  const doc = await db.doc(TIMER_DOC).get();
  res.json({ ok: true, timer: doc.exists ? doc.data() : { startTime: null, duration: 3000 } });
});
router.post('/kickoff', async (req, res) => {
  const startTime = Date.now();
  await db.doc(TIMER_DOC).set({ startTime, duration: 3000, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  res.json({ ok: true, startTime });
});
router.post('/reset', async (req, res) => {
  const batch = db.batch();
  batch.delete(db.doc(TIMER_DOC));
  if (req.body.clearTeams) {
    const snap = await db.collection('teams').get();
    snap.docs.forEach(d => batch.delete(d.ref));
  }
  await batch.commit();
  res.json({ ok: true });
});
router.get('/state', async (req, res) => {
  const snap = await db.collection('teams').orderBy('score', 'desc').get();
  res.json({ ok: true, teams: snap.docs.map(d => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toMillis() || 0 })) });
});
router.post('/team/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ ok: false, error: "Nome obrigatório" });
  const snap = await db.collection('teams').where('name', '==', name).limit(1).get();
  if (!snap.empty) {
    const d = snap.docs[0].data();
    return res.json({ ok: true, team: { id: snap.docs[0].id, name: d.name, token: d.token } });
  }
  const id = `team-${Date.now()}`, token = Math.random().toString(36).substr(2);
  const data = { id, token, name, score: 0, completedRooms: [], bonusMap: {}, status: 'in-progress', updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection('teams').doc(id).set(data);
  res.json({ ok: true, team: { id, name, token } });
});
router.post('/team/update', async (req, res) => {
  const { name, token, completedRoom, sourceCode, status, result } = req.body;
  const snap = await db.collection('teams').where('name', '==', name).limit(1).get();
  if (snap.empty) return res.status(404).json({ ok: false, error: "Equipa não encontrada" });
  const teamDoc = snap.docs[0], teamData = teamDoc.data();
  if (token && teamData.token !== token) return res.status(403).json({ ok: false, error: "Token inválido" });
  let pts = 0, bonus = 0, msg = result || "";
  if (completedRoom && sourceCode) {
    if (teamData.completedRooms && teamData.completedRooms.includes(completedRoom)) return res.json({ ok: true, message: "Já concluído." });
    const v = validateRoomCode(completedRoom, sourceCode);
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });
    pts = v.points; bonus = v.bonus || 0;
    msg = `Missão cumprida! (+${pts + bonus} pts)`;
  }
  const upd = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (status) upd.status = status;
  if (msg) upd.lastResult = msg;
  if (pts > 0) {
    upd.score = admin.firestore.FieldValue.increment(pts + bonus);
    upd.completedRooms = admin.firestore.FieldValue.arrayUnion(completedRoom);
    if (bonus > 0) upd[`bonusMap.${completedRoom}`] = bonus;
    upd.status = 'completed-' + completedRoom;
  }
  await teamDoc.ref.update(upd);
  res.json({ ok: true, pointsAdded: pts + bonus });
});
app.use('/api', router);
app.use('/', router);
exports.api = functions.https.onRequest(app);
