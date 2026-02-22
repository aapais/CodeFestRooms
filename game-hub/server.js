'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
// No IDX, usamos o porto que o sistema der (geralmente 4000 ou 9000)
const PORT = process.env.PORT || 4000;

app.use(express.json());

// --- SERVIR FRONTENDS ---
// Servir o Hub na raiz
app.use(express.static(path.join(__dirname, 'public')));

// Servir cada sala como uma sub-pasta
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- APIS LOCAIS (Para os botões funcionarem no IDX) ---

// Leitura de código para validação remota
app.get('/api/local-source/:room', (req, res) => {
  const room = req.params.room;
  const paths = {
    room1: '../rooms/room1-archaeology/src/legacyService.js',
    room2: '../rooms/room2-refactor-lab/src/invoiceEngine.js',
    room3: '../rooms/room3-security-vault/src/userRepo.js',
    final: '../rooms/final-modernisation/src/monolith.js'
  };
  try {
    const source = fs.readFileSync(path.join(__dirname, paths[room]), 'utf8');
    res.json({ ok: true, source });
  } catch (e) { res.status(500).json({ ok: false, error: 'Ficheiro não encontrado' }); }
});

// Mock da Room 1 para os botões Login/Checkout funcionarem localmente
app.post(['/api/login', '/room1/api/login'], (req, res) => res.json({ ok: true, token: 'idx-token' }));
app.post(['/api/checkout', '/room1/api/checkout'], (req, res) => {
  res.json({ ok: true, order: { id: 'IDX-SIM', amounts: { subtotalCents: 200000, discountCents: 20000, shippingCents: 45000, taxCents: 41400, totalCents: 266400 } } });
});

// Mock da Room 2 para ver faturas
app.post(['/api/invoice', '/room2/api/invoice'], (req, res) => {
  res.json({ ok: true, invoice: { amounts: { subtotal: 1200, discount: 240, shipping: 0, tax: 220.8, total: 1180.8 }, lines: [{ sku: 'VIP-SUB', qty: 1, unitPrice: 1200, lineTotal: 1200 }], currency: 'EUR' }, meta: { timeMs: 42 } });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR UNIFICADO ONLINE`);
  console.log(`🔗 Acede ao Preview do IDX para começar.`);
});
