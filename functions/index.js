/**
 * Firebase Functions - Multi-Route Compatibility Fix
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
    const sandbox = { module: { exports: {} }, require: (mod) => mod === 'crypto' ? crypto : {}, console: { log: () => {} }, Date, Math, Number, String, JSON };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 1000 });
    const svc = sandbox.module.exports;
    svc.createUser('V', 'P');
    const auth = svc.authenticate('V', 'P');
    const res = svc.placeOrder(auth.token, { items: [{ priceCents: 1000, qty: 5 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } });
    if (!res || !res.order || !res.order.amounts) return { ok: false, error: "PlaceOrder falhou." };
    const tax = res.order.amounts.taxCents;
    if (tax === 1139) return { ok: true };
    if (tax === 1035) return { ok: false, error: "IVA ignorou os portes." };
    return { ok: false, error: "IVA incorreto." };
  } catch (e) { return { ok: false, error: "Erro: " + e.message }; }
}

// --- API ROUTES (Sinalizando ambos os caminhos para evitar 404) ---

app.get(['/state', '/api/state'], async (req, res) => {
  const snapshot = await db.collection('teams').get();
  const teams = [];
  snapshot.forEach(doc => teams.push(doc.data()));
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
  if (!doc.exists) return res.status(404).json({ ok: false, error: 'Not found' });
  const team = doc.data();
  if (team.token !== token) return res.status(403).json({ ok: false, error: 'Token invalid' });

  if (completedRoom && !team.completedRooms.includes(completedRoom)) {
    let v = { ok: true };
    if (completedRoom === 'room1') v = validateRoom1(sourceCode);
    if (!v.ok) return res.json({ ok: false, error: v.error });

    await teamRef.update({
      completedRooms: [...team.completedRooms, completedRoom],
      score: (team.score || 0) + (ROOM_POINTS[completedRoom] || 0),
      updatedAt: Date.now(),
      lastResult: `✅ ${completedRoom} completa!`
    });
  }
  res.json({ ok: true });
});

app.post(['/reset', '/api/reset'], async (req, res) => {
  try {
    await db.collection('gameState').doc('timer').delete();
    if (req.body && req.body.clearTeams) {
      const snp = await db.collection('teams').get();
      const batch = db.batch();
      snp.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

exports.api = functions.https.onRequest(app);
