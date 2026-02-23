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

// --- 1. APIS DE LÓGICA (PRIORIDADE MÁXIMA) ---

// Room 1 API
app.post('/room1/api/login', (req, res) => res.json({ ok: true }));
app.post('/room1/api/checkout', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console, Date, Math, Number, String, JSON, Array, Object };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports; svc.createUser('U', 'P'); const auth = svc.authenticate('U', 'P');
    res.json(svc.placeOrder(auth.token, { items: [{ sku: 'MB', qty: 2, priceCents: 100000 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }));
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// Room 2 API
app.post('/room2/api/invoice', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const sandbox = { module: { exports: {} }, console, Date, Math, Number, String, JSON, Array, Object };
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

// Room 3 API
app.post('/room3/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8');
    if (password.includes("' OR '1'='1") && (source.includes(" + password") || source.includes("' + "))) return res.json({ ok: true, msg: "🔓 ACCESS GRANTED (Exploited)" });
    if (username === 'admin' && password === 'admin') return res.json({ ok: true, msg: "🔓 ACCESS GRANTED" });
    res.json({ ok: false, msg: "Denied" });
  } catch (e) { res.status(500).json({ ok: false, msg: "System Error" }); }
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

// Room 4 API (Final)
app.get('/final/status', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.post('/final/api/score', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8');
    const sandbox = { 
      module: { exports: {} }, exports: {}, console, Date, Math, Number, String, JSON, Array, Object, Error,
      require: () => ({}), process: { argv: [], exit: () => {} }
    };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports.calcScore ? sandbox.module.exports : (sandbox.exports.calcScore ? sandbox.exports : sandbox);
    if (typeof svc.calcScore !== 'function') throw new Error("A função calcScore não foi exportada corretamente.");
    res.json({ ok: true, ...svc.calcScore(req.body) });
  } catch (e) { res.status(500).json({ ok: false, error: "Erro no Monólito: " + e.message }); }
});
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));

// --- 2. SERVIR FRONTENDS (DEPOIS DAS APIS) ---
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));
app.use(express.static(path.join(__dirname, 'public')));

// API DE SINCRONIZAÇÃO DASHBOARD
app.get('/api/state', (req, res) => res.json({ ok: true, teams: [] }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: null }));

app.listen(PORT, () => console.log(`🚀 UNIFIED SERVER ONLINE ON PORT ${PORT}`));
