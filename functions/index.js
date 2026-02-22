/**
 * Firebase Functions for Visual Escape Room
 * Servidor central estável
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

const ROOM_ORDER = ['room1', 'room2', 'room3', 'final'];
const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };
const ROOM_OBJECTIVES = {
  'room1': { name: '🏺 Arqueologia de Código' },
  'room2': { name: '🔧 Laboratório de Refatorização' },
  'room3': { name: '🔒 Cofre de Segurança' },
  'final': { name: '🚀 Modernização Final' }
};

// --- VALIDATION ENGINES ---

function validateRoom1(source) {
  try {
    const sandbox = { module: { exports: {} }, require: (mod) => { if (mod === 'crypto') return crypto; throw new Error(); }, console: { log: () => {} } };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 300 });
    const service = sandbox.module.exports;
    service.createUser('v', 'p');
    const auth = service.authenticate('v', 'p');
    const res = service.placeOrder(auth.token, { items: [{ priceCents: 1000, qty: 5 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } });
    if (res.order.amounts.taxCents === 1139) return { ok: true };
    return { ok: false, error: "IVA incorreto. Verifica a base de cálculo." };
  } catch (e) { return { ok: false, error: "Erro: " + e.message }; }
}

function validateRoom2(source) {
  try {
    const sandbox = { module: { exports: {} }, console: { log: () => {} } };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 300 });
    const engine = new sandbox.module.exports.InvoiceEngine();
    const res = engine.generateInvoice({ items: [{ unitPrice: 100, qty: 2 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }, { flags: {} });
    if (Math.abs(res.amounts.total - 221.4) < 0.1) {
      const complexity = (source.match(/\b(if|else|switch|for|while|&&|\|\||\?)\b/g) || []).length;
      return { ok: true, complexity };
    }
    return { ok: false, error: "Lógica quebrada." };
  } catch (e) { return { ok: false, error: "Erro: " + e.message }; }
}

function validateRoom3(source) {
  const isSafe = !source.includes("WHERE username = '") && (source.includes("?") || source.includes("$1"));
  if (!isSafe) return { ok: false, error: "Vulnerabilidade detetada." };
  return { ok: true, bonus: source.includes('bcrypt') || source.includes('.hash') };
}

function validateFinal(source) {
  try {
    const sandbox = { module: { exports: {} }, console: { log: () => {} } };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 300 });
    const res = sandbox.module.exports.calcScore({ age: 25, country: 'PT', spends: [10] });
    return res && res.score !== undefined ? { ok: true } : { ok: false, error: "Erro lógica." };
  } catch (e) { return { ok: false, error: "Erro: " + e.message }; }
}

// --- HELPER ---
function normalizeTeamName(name) { return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Team'; }

// --- API ROUTES ---

app.get(['/state', '/api/state'], async (req, res) => {
  const snapshot = await db.collection('teams').get();
  const teams = [];
  snapshot.forEach(doc => teams.push({ id: doc.id, ...doc.data() }));
  teams.sort((a, b) => (b.score - a.score) || (a.updatedAt - b.updatedAt));
  res.json({ ok: true, teams });
});

app.post(['/team/login', '/api/team/login'], async (req, res) => {
  const name = normalizeTeamName(req.body && req.body.name);
  const teamRef = db.collection('teams').doc(name);
  const doc = await teamRef.get();
  let team = doc.exists ? doc.data() : { id: name, name, token: Math.random().toString(36).slice(2), room: 'room1', score: 0, completedRooms: [], updatedAt: Date.now() };
  if (!doc.exists) await teamRef.set(team);
  res.json({ ok: true, team });
});

app.post(['/team/update', '/api/team/update'], async (req, res) => {
  const { name, token, sourceCode, completedRoom, room, status, result } = req.body || {};
  const teamRef = db.collection('teams').doc(normalizeTeamName(name));
  const doc = await teamRef.get();
  if (!doc.exists) return res.status(404).json({ ok: false, error: 'Not found' });
  const team = doc.data();
  if (team.token !== token) return res.status(403).json({ ok: false, error: 'Invalid token' });

  const updates = { updatedAt: Date.now() };
  if (room) { updates.room = room; if (!team[`start_${room}`]) updates[`start_${room}`] = Date.now(); }
  if (status) updates.status = status;
  if (result) updates.lastResult = result;

  if (completedRoom && !team.completedRooms.includes(completedRoom)) {
    let v = { ok: true };
    if (completedRoom === 'room1') v = validateRoom1(sourceCode);
    if (completedRoom === 'room2') v = validateRoom2(sourceCode);
    if (completedRoom === 'room3') v = validateRoom3(sourceCode);
    if (completedRoom === 'final') v = validateFinal(sourceCode);
    
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });

    updates.completedRooms = [...team.completedRooms, completedRoom];
    updates.score = (team.score || 0) + ROOM_POINTS[completedRoom];
    updates[`end_${completedRoom}`] = Date.now();

    // Bonus logic
    if (completedRoom === 'room1' && (sourceCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length >= 3) { updates.score += 50; updates.lastResult = "✅ Room 1 + BÓNUS Documentação!"; }
    else if (completedRoom === 'room2' && v.complexity < 5) { updates.score += 75; updates.lastResult = `✅ Room 2 + BÓNUS Master Refactor (${v.complexity})!`; }
    else if (completedRoom === 'room3' && v.bonus) { updates.score += 100; updates.lastResult = "✅ Room 3 + BÓNUS Criptografia!"; }
    else if (completedRoom === 'final' && sourceCode.includes('/health')) { updates.score += 50; updates.lastResult = "✅ Missão Final + BÓNUS Ops!"; }
    else { updates.lastResult = `✅ Sala ${completedRoom} completa!`; }
  }

  await teamRef.update(updates);
  res.json({ ok: true });
});

app.get(['/timer', '/api/timer'], async (req, res) => {
  const doc = await db.collection('gameState').doc('timer').get();
  res.json({ ok: true, timer: doc.exists ? doc.data() : null });
});

app.post(['/kickoff', '/api/kickoff'], async (req, res) => {
  const startTime = Date.now();
  await db.collection('gameState').doc('timer').set({ startTime, duration: 50*60*1000, updatedAt: startTime });
  res.json({ ok: true, startTime });
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
