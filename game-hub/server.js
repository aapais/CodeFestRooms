'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

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

// --- API DE SINCRONIZAÇÃO (Dashboard & HQ) ---
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

// --- API ROOM 1 ---
app.post('/room1/api/login', (req, res) => res.json({ ok: true }));
app.post('/room1/api/checkout', (req, res) => res.json({ ok: true, order: { id: 'ORD-123', amounts: { subtotalCents: 200000, discountCents: 20000, shippingCents: 45000, taxCents: 41400, totalCents: 266400 } } }));
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// --- API ROOM 2 ---
app.post('/room2/api/invoice', (req, res) => res.json({ ok: true, invoice: { amounts: { total: 1180.8 } } }));
app.get('/room2/api/validate-complexity', (req, res) => res.json({ ok: true, message: "Quality Scan OK." }));
app.get('/room2/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') }));

// --- API ROOM 3 ---
app.post('/room3/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && (password.includes("' OR '1'='1") || password === 'secret')) return res.json({ ok: true, msg: "🔓 ACCESS GRANTED" });
  res.json({ ok: false, msg: "Access Denied" });
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

// --- API FINAL ---
app.get('/final/status', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.post('/final/api/score', (req, res) => res.json({ ok: true, score: 850, risk: "LOW" }));
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));

app.listen(PORT, () => console.log(`🚀 WORKSHOP SERVER ONLINE ON PORT ${PORT}`));
