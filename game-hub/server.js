'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- BASE DE DADOS EM MEMÓRIA (Para o Workshop) ---
const teams = new Map();
let gameTimer = null;

// --- SERVIR FRONTENDS ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API DE SINCRONIZAÇÃO (Equipas e Dashboard) ---

app.get('/api/state', (req, res) => {
  res.json({ ok: true, teams: Array.from(teams.values()) });
});

app.get('/api/timer', (req, res) => {
  res.json({ ok: true, timer: gameTimer });
});

app.post('/api/kickoff', (req, res) => {
  gameTimer = { startTime: Date.now(), duration: 50 * 60 * 1000 };
  res.json({ ok: true, startTime: gameTimer.startTime });
});

app.post('/api/team/login', (req, res) => {
  const name = req.body.name || 'Operative';
  if (!teams.has(name)) {
    teams.set(name, { 
      name, 
      token: 'tk-' + Math.random().toString(36).slice(2), 
      score: 0, 
      completedRooms: [], 
      room: 'room1', 
      lastResult: 'Initialized',
      updatedAt: Date.now() 
    });
  }
  res.json({ ok: true, team: teams.get(name) });
});

app.post('/api/team/update', (req, res) => {
  const { name, completedRoom, room, result } = req.body;
  const team = teams.get(name);
  if (team) {
    if (room) team.room = room;
    if (result) team.lastResult = result;
    if (completedRoom && !team.completedRooms.includes(completedRoom)) {
      team.completedRooms.push(completedRoom);
      team.score += 100; // Pontuação simplificada
    }
    team.updatedAt = Date.now();
  }
  res.json({ ok: true });
});

// --- API DA ROOM 1 (Login da Loja - SIMPLIFICADO) ---
app.post('/room1/api/login', (req, res) => {
  // Aceita tudo para não travar o workshop
  res.json({ ok: true, token: 'idx-fake-token', user: { username: req.body.username || 'Operative' } });
});

app.post('/room1/api/checkout', (req, res) => {
  res.json({ ok: true, order: { id: 'ORD-' + Math.random().toString(36).slice(-5).toUpperCase(), amounts: { subtotalCents: 200000, discountCents: 20000, shippingCents: 45000, taxCents: 41400, totalCents: 266400 } } });
});

app.get('/room1/api/source', (req, res) => {
  const src = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
  res.json({ ok: true, source: src });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR CENTRALIZADO ONLINE NA PORTA ${PORT}`);
  console.log(`📡 Dashboard em /dashboard.html`);
});
