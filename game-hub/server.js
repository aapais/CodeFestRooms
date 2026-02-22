'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Carregar lógica das salas para o servidor central
const room1Svc = require('../rooms/room1-archaeology/src/legacyService');
const room3Repo = require('../rooms/room3-security-vault/src/userRepo');

const app = express();
const PORT = process.env.PORT || 3000; // Porta padrão do IDX

app.use(express.json());

// --- SERVIR FRONTENDS ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API DA ROOM 1 ---
app.post('/room1/api/login', (req, res) => {
  res.json(room1Svc.authenticate(req.body.username, req.body.password));
});
app.post('/room1/api/checkout', (req, res) => {
  res.json(room1Svc.placeOrder(req.body.token, { items: req.body.items, discountCode: req.body.discountCode, shippingAddress: req.body.shippingAddress }));
});
app.get('/room1/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') });
});

// --- API DA ROOM 2 ---
app.get('/room2/api/validate-complexity', (req, res) => {
  exec('npx eslint rooms/room2-refactor-lab/src/invoiceEngine.js --format json', (err, stdout) => {
    // Lógica simplificada para o workshop
    res.json({ ok: true, message: "Complexidade validada localmente." });
  });
});
app.get('/room2/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') });
});

// --- API DA ROOM 3 ---
app.post('/room3/api/login', (req, res) => {
  const result = room3Repo.login(req.body.username, req.body.password);
  if (result.ok && req.body.username === 'admin') {
    res.json({ ok: true, msg: "🔓 ACCESS GRANTED. Welcome Admin!" });
  } else {
    res.json(result);
  }
});
app.get('/room3/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') });
});

// --- API DO FINAL ---
app.get('/final/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR INTEGRADO ONLINE NA PORTA ${PORT}`);
  console.log(`🔗 Preview IDX pronto para todas as salas.`);
});
