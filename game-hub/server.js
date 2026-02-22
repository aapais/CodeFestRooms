'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
// PORTA DE EMERGÊNCIA 8080
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- SERVIR TUDO DE FORMA ESTÁTICA ---
// Isto elimina a necessidade de portos extra (3000, 3002, etc)
// Tudo corre na mesma porta 4000.

// 1. O Hub na raiz (/)
app.use(express.static(path.join(__dirname, 'public')));

// 2. As salas como sub-pastas reais
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API LOCAL PARA LER CÓDIGO NO IDX ---
app.get('/api/local-source/:room', (req, res) => {
  const room = req.params.room;
  const paths = {
    room1: '../rooms/room1-archaeology/src/legacyService.js',
    room2: '../rooms/room2-refactor-lab/src/invoiceEngine.js',
    room3: '../rooms/room3-security-vault/src/userRepo.js',
    final: '../rooms/final-modernisation/src/monolith.js'
  };
  try {
    const filePath = path.join(__dirname, paths[room]);
    const source = fs.readFileSync(filePath, 'utf8');
    res.json({ ok: true, source });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Código não encontrado no IDX' });
  }
});

// Mock para os botões das salas funcionarem sem precisar dos servidores das salas ligados
app.post(['/room1/api/login', '/api/login'], (req, res) => res.json({ ok: true, token: 'idx-token' }));
app.post(['/room1/api/checkout', '/api/checkout'], (req, res) => res.json({ ok: true, order: { id: 'IDX-SIM', amounts: { subtotalCents: 200000, discountCents: 20000, shippingCents: 45000, taxCents: 41400, totalCents: 266400 } } }));
app.post(['/room2/api/invoice', '/api/invoice'], (req, res) => res.json({ ok: true, invoice: { amounts: { subtotal: 1200, discount: 240, shipping: 0, tax: 220.8, total: 1180.8 }, lines: [{ sku: 'VIP-SUB', qty: 1, unitPrice: 1200, lineTotal: 1200 }], currency: 'EUR' }, meta: { timeMs: 42 } }));

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR ÚNICO ONLINE NA PORTA ${PORT}`);
  console.log(`💡 Todas as salas estão agora disponíveis neste porto.`);
});
