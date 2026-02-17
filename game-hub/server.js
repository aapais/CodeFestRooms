'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.HUB_PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve shared config files
app.get('/timingConfig.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../shared/timingConfig.js'));
});
app.get('/config.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../shared/config.js'));
});

// Simple CORS for cross-port calls from room previews
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const teams = new Map();
const ROOM_ORDER = ['room1', 'room2', 'room3', 'final'];
const ROOM_POINTS = {
  room1: 100,
  room2: 150,
  room3: 150,
  final: 200
};

function normalizeTeamName(name) {
  const safe = String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 32);
  return safe || 'Team';
}

function upsertTeam(name, updates = {}) {
  const id = normalizeTeamName(name);
  const existing = teams.get(id) || {
    id,
    name: id,
    room: 'room1',
    score: 0,
    completedRooms: [],
    status: 'in-progress',
    lastResult: '',
    updatedAt: Date.now()
  };

  const scoreDelta = Number.isFinite(updates.scoreDelta) ? updates.scoreDelta : 0;
  const completedRoom = updates.completedRoom;
  const completedRooms = Array.isArray(existing.completedRooms)
    ? [...existing.completedRooms]
    : [];
  let computedScoreDelta = scoreDelta;

  if (completedRoom && !completedRooms.includes(completedRoom)) {
    completedRooms.push(completedRoom);
    computedScoreDelta += ROOM_POINTS[completedRoom] || 0;
  }

  const merged = {
    ...existing,
    ...updates,
    score: Math.max(0, existing.score + computedScoreDelta),
    completedRooms,
    updatedAt: Date.now()
  };

  teams.set(id, merged);
  return merged;
}

function getState() {
  return Array.from(teams.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.updatedAt - b.updatedAt;
  });
}

function broadcastState() {
  const payload = JSON.stringify({ type: 'state', teams: getState() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

app.get('/api/state', (req, res) => {
  res.json({ ok: true, teams: getState() });
});

app.post('/api/team/login', (req, res) => {
  const name = normalizeTeamName(req.body && req.body.name);
  const team = upsertTeam(name, { status: 'in-progress' });
  broadcastState();
  res.json({ ok: true, team });
});

app.post('/api/team/update', (req, res) => {
  const body = req.body || {};
  const name = normalizeTeamName(body.name);
  const completedRoom = body.completedRoom || (body.status === 'completed' ? body.room : undefined);
  const team = upsertTeam(name, {
    room: body.room || undefined,
    status: body.status || undefined,
    lastResult: body.result || undefined,
    completedRoom,
    scoreDelta: Number(body.scoreDelta || 0)
  });
  broadcastState();
  res.json({ ok: true, team });
});

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'state', teams: getState() }));
});

server.listen(PORT, () => {
  console.log(`Game Hub running at http://localhost:${PORT}`);
});
