'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- SERVIR FRONTENDS ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API ROOM 1 ---
app.post('/room1/api/login', (req, res) => res.json({ ok: true }));
app.post('/room1/api/checkout', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console, Date, Math, Number, String, JSON, Array };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports; svc.createUser('U', 'P'); const auth = svc.authenticate('U', 'P');
    res.json(svc.placeOrder(auth.token, { items: [{ sku: 'MB', qty: 2, priceCents: 100000 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }));
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// --- API ROOM 2 ---
app.post('/room2/api/invoice', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const sandbox = { module: { exports: {} }, console, Date, Math, Number, String, JSON, Array };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const engine = new sandbox.module.exports.InvoiceEngine();
    res.json({ ok: true, invoice: engine.generateInvoice(req.body, { tier: 'VIP' }) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room2/api/validate-complexity', (req, res) => {
  exec('npx eslint src/invoiceEngine.js --rule "complexity: [\'warn\', 1]" --format json', { cwd: path.join(__dirname, '../rooms/room2-refactor-lab') }, (err, stdout) => {
    try {
      const results = JSON.parse(stdout);
      const messages = results[0].messages.filter(m => m.ruleId === 'complexity');
      let maxComp = 0; messages.forEach(m => { const c = parseInt(m.message.match(/complexity of (\d+)/)[1]); if (c > maxComp) maxComp = c; });
      res.json({ ok: maxComp <= 10, message: maxComp <= 10 ? `Código Limpo! Max: ${maxComp}` : `Complexidade Alta: ${maxComp}` });
    } catch (e) { res.json({ ok: false, message: "Erro no scanner." }); }
  });
});
app.get('/room2/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') }));

// --- API ROOM 3 ---
app.post('/room3/api/login', (req, res) => {
  const { username, password } = req.body;
  const source = fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8');
  if (password.includes("' OR '1'='1") && (source.includes(" + password") || source.includes("' + "))) {
    return res.json({ ok: true, msg: "🔓 ACCESS GRANTED (Exploited)" });
  }
  if (username === 'admin' && password === 'admin') return res.json({ ok: true, msg: "🔓 ACCESS GRANTED" });
  res.json({ ok: false, msg: "Denied" });
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

// --- API FINAL MISSION (Fix 500 and Logic) ---
app.get('/final/status', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.post('/final/api/score', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8');
    const sandbox = { 
      module: { exports: {} }, exports: {}, console, Date, Math, Number, String, JSON, Array,
      require: () => ({}), process: { argv: [], exit: () => {} }
    };
    vm.createContext(sandbox); 
    vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports.calcScore ? sandbox.module.exports : sandbox.exports;
    if (!svc.calcScore) throw new Error("A função calcScore não foi exportada corretamente.");
    const result = svc.calcScore(req.body);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("[ROOM4_ERR]", e.message);
    res.status(500).json({ ok: false, error: "Erro no Monólito: " + e.message });
  }
});
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));

// --- API DE SINCRONIZAÇÃO DASHBOARD ---
const teams = new Map();
let gameTimer = null;
app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));
app.post('/api/kickoff', (req, res) => { gameTimer = { startTime: Date.now(), duration: 50*60*1000 }; res.json({ ok: true }); });
app.post('/api/team/login', (req, res) => {
  const name = req.body.name || 'Team';
  if (!teams.has(name)) teams.set(name, { name, score: 0, completedRooms: [], updatedAt: Date.now(), token: 'tk-' + Math.random().toString(36).slice(2) });
  res.json({ ok: true, team: teams.get(name) });
});

app.listen(PORT, () => console.log(`🚀 UNIFIED SERVER ONLINE ON PORT ${PORT}`));
