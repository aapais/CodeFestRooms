'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || process.env.HUB_PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[HUB_LOG] ${req.method} ${req.url}`);
  next();
});

// Serve shared config files
app.get('/timingConfig.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../shared/timingConfig.js'));
});
app.get('/config.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../shared/config.js'));
});

// Simple CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const teams = new Map();
let gameTimer = null;

const ROOM_ORDER = ['room1', 'room2', 'room3', 'final'];
const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

function normalizeTeamName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Team';
}

function upsertTeam(name, updates = {}) {
  const id = normalizeTeamName(name);
  const existing = teams.get(id) || {
    id, name: id, token: Math.random().toString(36).substring(2, 15),
    room: 'room1', score: 0, completedRooms: [], status: 'active', updatedAt: Date.now()
  };
  const merged = { ...existing, ...updates, updatedAt: Date.now() };
  teams.set(id, merged);
  return merged;
}

function getState() {
  return Array.from(teams.values()).sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt);
}

function broadcastState() {
  const payload = JSON.stringify({ type: 'state', teams: getState(), timer: gameTimer });
  wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); });
}

app.get('/api/state', (req, res) => res.json({ ok: true, teams: getState(), timer: gameTimer }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));

app.post('/api/kickoff', (req, res) => {
  gameTimer = { startTime: Date.now(), duration: 50 * 60 * 1000, updatedAt: Date.now() };
  broadcastState();
  res.json({ ok: true, startTime: gameTimer.startTime });
});

app.post('/api/reset', (req, res) => {
  gameTimer = null;
  if (req.body && req.body.clearTeams) teams.clear();
  broadcastState();
  res.json({ ok: true });
});

app.post('/api/team/login', (req, res) => {
  const name = normalizeTeamName(req.body && req.body.name);
  const team = upsertTeam(name);
  broadcastState();
  res.json({ ok: true, team });
});

app.post('/api/team/update', (req, res) => {
  const body = req.body || {};
  const team = upsertTeam(body.name, {
    room: body.room, status: body.status, lastResult: body.result
  });
  broadcastState();
  res.json({ ok: true, team });
});

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'state', teams: getState() }));
});

server.listen(PORT, () => {
  console.log(`Game Hub (Login/API) running at port ${PORT}`);
});
