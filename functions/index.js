/**
 * Firebase Functions - High Reliability Version with Room 2 Logic
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const vm = require('vm');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

// --- ENGINE ROOM 1 ---
function validateRoom1(source) {
  try {
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console: { log: () => {} }, Date, Math, Number, String, JSON };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 1000 });
    const svc = sandbox.module.exports;
    svc.createUser('V', 'P');
    const auth = svc.authenticate('V', 'P');
    const res = svc.placeOrder(auth.token, { items: [{ priceCents: 1000, qty: 5 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } });
    if (res.order.amounts.taxCents === 1139) return { ok: true };
    return { ok: false, error: "IVA incorreto." };
  } catch (e) { return { ok: false, error: "Erro sintaxe." }; }
}

// --- ENGINE ROOM 2 ---
function validateRoom2(source) {
  try {
    const sandbox = { module: { exports: {} }, console: { log: () => {} }, Math, Number, String, JSON, Array };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 1000 });
    const engine = new sandbox.module.exports.InvoiceEngine();
    const res = engine.generateInvoice({ items: [{ unitPrice: 100, qty: 2 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }, { tier: 'VIP' });
    
    // Verificar se a lógica de cálculo continua correta
    if (Math.abs(res.amounts.total - 221.4) < 0.1) {
      // Contagem aproximada de complexidade via regex no servidor
      const complexity = (source.match(/\b(if|else|switch|for|while|&&|\|\||\?)\b/g) || []).length;
      return { ok: true, complexity };
    }
    return { ok: false, error: "A lógica do motor de faturas foi quebrada!" };
  } catch (e) { return { ok: false, error: "Erro no motor: " + e.message }; }
}

// --- API ROUTES ---

app.get(['/state', '/api/state'], async (req, res) => {
  const snapshot = await db.collection('teams').get();
  const teams = [];
  snapshot.forEach(doc => teams.push(doc.data()));
  teams.sort((a,b) => b.score - a.score);
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

app.post(['/team/login', '/api/team/login'], async (req, res) => {
  const name = String(req.body.name || 'Team').trim();
  const teamRef = db.collection('teams').doc(name);
  const doc = await teamRef.get();
  let team = doc.exists ? doc.data() : { name, token: Math.random().toString(36).slice(2), score: 0, completedRooms: [], updatedAt: Date.now() };
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

  if (completedRoom && !team.completedRooms.includes(completedRoom)) {
    let v = { ok: true };
    if (completedRoom === 'room1') v = validateRoom1(sourceCode);
    if (completedRoom === 'room2') v = validateRoom2(sourceCode);
    
    if (!v.ok) return res.json({ ok: false, error: v.error });

    let finalScore = (team.score || 0) + ROOM_POINTS[completedRoom];
    let resultMsg = `✅ Sala ${completedRoom} completa!`;

    if (completedRoom === 'room1' && (sourceCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length >= 3) { finalScore += 50; resultMsg = "✅ Room 1 + BÓNUS Doc!"; }
    if (completedRoom === 'room2' && v.complexity < 10) { finalScore += 75; resultMsg = `✅ Room 2 + BÓNUS Refactor (${v.complexity})!`; }

    await teamRef.update({ completedRooms: [...team.completedRooms, completedRoom], score: finalScore, updatedAt: Date.now(), lastResult: resultMsg });
  }
  res.json({ ok: true });
});

app.post(['/reset', '/api/reset'], async (req, res) => {
  await db.collection('gameState').doc('timer').delete();
  if (req.body && req.body.clearTeams) {
    const snp = await db.collection('teams').get();
    const batch = db.batch();
    snp.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  res.json({ ok: true });
});

exports.api = functions.https.onRequest(app);
