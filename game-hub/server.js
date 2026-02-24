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

// --- 1. APIS DE LÓGICA (Prioridade Máxima) ---

app.post('/room1/api/login', (req, res) => res.json({ ok: true }));
app.post('/room1/api/checkout', (req, res) => {
  try {
    const src = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console, Date, Math, Number, String, JSON, Array, Object };
    vm.createContext(sandbox); vm.runInContext(src, sandbox);
    const svc = sandbox.module.exports; svc.createUser('U', 'P'); const auth = svc.authenticate('U', 'P');
    res.json(svc.placeOrder(auth.token, { items: [{ sku: 'X', qty: 2, priceCents: 100000 }], discountCode: 'WELCOME10' }));
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// Room 2 API - Robust Implementation
app.post('/room2/api/invoice', (req, res) => {
  try {
    const src = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const sandbox = { module: { exports: {} }, exports: {}, console, Date, Math, Number, String, JSON, Array, Object, Error };
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox);
    
    // Tenta encontrar a classe InvoiceEngine em vários locais possíveis
    const EngineClass = sandbox.module.exports.InvoiceEngine || sandbox.exports.InvoiceEngine || sandbox.InvoiceEngine;
    
    if (!EngineClass) throw new Error("A classe 'InvoiceEngine' não foi exportada corretamente.");
    
    const engine = new EngineClass();
    const result = engine.generateInvoice(req.body, { tier: 'VIP' });
    res.json({ ok: true, invoice: result });
  } catch (e) {
    console.error("[ROOM2_API_ERR]", e.message);
    res.status(500).json({ ok: false, error: "Erro no Motor de Faturação: " + e.message });
  }
});

app.get('/room2/api/validate-complexity', (req, res) => {
  try {
    const src = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const clean = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const complexity = (clean.match(/\b(if|else|switch|for|while|&&|\|\||\?)\b/g) || []).length;
    if (complexity > 12) {
      res.json({ ok: false, message: `RISCO ESTRUTURAL: ${complexity}`, details: `O limite para esta missão é 12.` });
    } else {
      res.json({ ok: true, message: `CÓDIGO LIMPO! Complexidade: ${complexity}`, details: "O sistema está otimizado para o QG." });
    }
  } catch (e) { res.json({ ok: false, message: "Erro ao ler ficheiro." }); }
});
app.get('/room2/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') }));

// Room 3 API
app.post('/room3/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const src = fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8');
    if (password.includes("' OR '1'='1") && (src.includes(" + password") || src.includes("' + "))) return res.json({ ok: true, msg: "🔓 ACCESS GRANTED (Vulnerability Exploited!)" });
    if (username === 'admin' && password === 'admin') return res.json({ ok: true, msg: "🔓 ACCESS GRANTED (Authorized)" });
    res.json({ ok: false, msg: "Denied" });
  } catch (e) { res.status(500).json({ ok: false, msg: "System Error" }); }
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

// Room 4 API (Final)
app.get('/final/status', (req, res) => {
  if (Math.random() < 0.2) return res.status(503).json({ ok: false });
  res.json({ ok: true, uptime: process.uptime() });
});
app.post('/final/api/score', (req, res) => {
  try {
    const src = fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8');
    const sandbox = { module: { exports: {} }, exports: {}, console, Date, Math, Number, String, JSON, Array, Object, Error, require: () => ({}), process: { argv: [], exit: () => {} } };
    vm.createContext(sandbox); vm.runInContext(src, sandbox);
    const svc = sandbox.module.exports.calcScore || sandbox.exports.calcScore || sandbox.calcScore;
    res.json({ ok: true, ...svc(req.body) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));
app.get('/final/api/source-server', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/server.js'), 'utf8') }));

// --- 2. SERVIR FRONTENDS ---
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`🚀 UNIFIED SERVER ONLINE ON PORT ${PORT}`));
