'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const { exec } = require('child_process');

// Carregar lógica das salas
const room1Svc = require('../rooms/room1-archaeology/src/legacyService');
const room3Repo = require('../rooms/room3-security-vault/src/userRepo');

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
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports; svc.createUser('U', 'P'); const auth = svc.authenticate('U', 'P');
    res.json(svc.placeOrder(auth.token, { items: [{ sku: 'MB', qty: 2, priceCents: 100000 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }));
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// --- API ROOM 2 (Fixing the 404 error) ---
app.post('/room2/api/invoice', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const sandbox = { module: { exports: {} }, console };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    const engine = new sandbox.module.exports.InvoiceEngine();
    const invoice = engine.generateInvoice(req.body, { tier: 'VIP' });
    res.json({ ok: true, invoice });
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

// --- API FINAL MISSION ---
app.get('/final/status', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.post('/final/api/score', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8');
    const sandbox = { module: { exports: {} }, console };
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const result = sandbox.module.exports.calcScore(req.body);
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));

app.listen(PORT, () => console.log(`🚀 UNIFIED WORKSHOP SERVER ONLINE ON PORT ${PORT}`));
