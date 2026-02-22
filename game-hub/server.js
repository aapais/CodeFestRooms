'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Servir o próprio Hub
app.use(express.static(path.join(__dirname, 'public')));

// Servir as Salas como sub-pastas (MUITO MAIS SIMPLES)
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// Endpoint local para ler o código da equipa no IDX
app.get('/api/local-source/:room', (req, res) => {
  const room = req.params.room;
  let filePath = '';
  if (room === 'room1') filePath = '../rooms/room1-archaeology/src/legacyService.js';
  if (room === 'room2') filePath = '../rooms/room2-refactor-lab/src/invoiceEngine.js';
  if (room === 'room3') filePath = '../rooms/room3-security-vault/src/userRepo.js';
  if (room === 'final') filePath = '../rooms/final-modernisation/src/monolith.js';

  try {
    const source = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    res.json({ ok: true, source });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Não foi possível ler o ficheiro no IDX' });
  }
});

// APIs locais de simulação (para que os botões de teste funcionem)
// Sala 1: Login e Checkout Simulado
app.post('/room1/api/login', (req, res) => res.json({ ok: true, token: 'fake-jwt' }));
app.post('/room1/api/checkout', (req, res) => {
  // Lógica mínima para o botão funcionar no IDX
  res.json({ ok: true, order: { id: 'IDX-TEST', amounts: { subtotalCents: 200000, discountCents: 20000, shippingCents: 45000, taxCents: 41400, totalCents: 266400 } } });
});

app.listen(PORT, () => {
  console.log(`\n🚀 WORKSHOP SERVER ONLINE`);
  console.log(`🔗 Preview IDX: http://localhost:${PORT}\n`);
});
