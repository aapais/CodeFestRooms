'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- BASE DE DADOS EM MEMÓRIA ---
const teams = new Map();
let gameTimer = null;

// --- SERVIR FRONTENDS ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API DE SINCRONIZAÇÃO ---
app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));
app.post('/api/kickoff', (req, res) => { gameTimer = { startTime: Date.now(), duration: 50 * 60 * 1000 }; res.json({ ok: true, startTime: gameTimer.startTime }); });
app.post('/api/team/login', (req, res) => {
  const name = req.body.name || 'Operative';
  if (!teams.has(name)) {
    teams.set(name, { name, token: 'tk-' + Math.random().toString(36).slice(2), score: 0, completedRooms: [], room: 'room1', updatedAt: Date.now() });
  }
  res.json({ ok: true, team: teams.get(name) });
});
app.post('/api/team/update', (req, res) => {
  const { name, completedRoom, room } = req.body;
  const team = teams.get(name);
  if (team) {
    if (room) team.room = room;
    if (completedRoom && !team.completedRooms.includes(completedRoom)) {
      team.completedRooms.push(completedRoom);
      team.score += 100;
    }
    team.updatedAt = Date.now();
  }
  res.json({ ok: true });
});

// --- API DINÂMICA DA ROOM 1 (Executa o código que o aluno está a editar) ---
app.post('/room1/api/login', (req, res) => res.json({ ok: true }));

app.post('/room1/api/checkout', (req, res) => {
  try {
    // Ler o código atual do ficheiro que o aluno está a editar
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    
    const svc = sandbox.module.exports;
    svc.createUser('User', 'Pass');
    const auth = svc.authenticate('User', 'Pass');
    
    // Simular o pedido do frontend
    const result = svc.placeOrder(auth.token, {
      items: [{ sku: 'Mystery Box', qty: 2, priceCents: 100000 }],
      discountCode: 'WELCOME10',
      shippingAddress: { country: 'PT' }
    });
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: "Erro no teu código: " + e.message });
  }
});

app.get('/room1/api/source', (req, res) => {
  res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') });
});

// APIs das outras salas (Mocks simples para funcionamento visual)
app.post('/room2/api/invoice', (req, res) => res.json({ ok: true, invoice: { amounts: { total: 1180.8 } } }));
app.get('/room2/api/validate-complexity', (req, res) => res.json({ ok: true, message: "Scan OK." }));
app.get('/room2/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') }));

app.post('/room3/api/login', (req, res) => {
  if (req.body.username === 'admin' && req.body.password.includes("' OR '1'='1")) return res.json({ ok: true, msg: "🔓 ACCESS GRANTED" });
  res.json({ ok: false, msg: "Denied" });
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

app.listen(PORT, () => console.log(`🚀 WORKSHOP SERVER ONLINE ON PORT ${PORT}`));
