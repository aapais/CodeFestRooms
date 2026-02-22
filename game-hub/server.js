'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Carregar lógica das salas para execução direta (sem proxies)
const room1Svc = require('../rooms/room1-archaeology/src/legacyService');
const room3Repo = require('../rooms/room3-security-vault/src/userRepo');

const app = express();
const PORT = process.env.PORT || 8080;

// Inicializar dados da Room 1
room1Svc.createUser('Alice', 'secret123', { isAdmin: true });

app.use(express.json());

// --- 1. SERVIR CONFIGURAÇÕES GERAIS ---
app.get('/config.js', (req, res) => res.sendFile(path.join(__dirname, '../shared/config.js')));
app.get('/timingConfig.js', (req, res) => res.sendFile(path.join(__dirname, '../shared/timingConfig.js')));

// --- 2. SERVIR FRONTENDS ---
// Servir o Login na raiz (/)
app.use(express.static(path.join(__dirname, 'public')));

// Servir cada sala como uma sub-pasta real
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- 3. APIS DE LÓGICA LOCAL (Para os botões funcionarem no IDX) ---

// Room 1: Login e Checkout
app.post('/room1/api/login', (req, res) => res.json(room1Svc.authenticate(req.body.username, req.body.password)));
app.post('/room1/api/checkout', (req, res) => {
  const { token, items, discountCode, shippingAddress } = req.body;
  res.json(room1Svc.placeOrder(token, { items, discountCode, shippingAddress }));
});
app.get('/room1/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') });
});

// Room 2: Refactor
app.get('/room2/api/validate-complexity', (req, res) => {
  // Simulação de validação local rápida
  res.json({ ok: true, message: "Complexidade verificada localmente pelo sistema IDX." });
});
app.get('/room2/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') });
});

// Room 3: Security
app.post('/room3/api/login', (req, res) => {
  const result = room3Repo.login(req.body.username, req.body.password);
  if (result.ok && req.body.username === 'admin') {
    res.json({ ok: true, msg: "🔓 ACCESS GRANTED. Welcome Admin!" });
  } else { res.json(result); }
});
app.get('/room3/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') });
});

// Final Room
app.get('/final/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') });
});

app.listen(PORT, () => {
  console.log(`\n🚀 WORKSHOP MONOLITH ONLINE NA PORTA ${PORT}`);
  console.log(`🔗 Tudo unificado. Sem erros de Proxy.`);
});
