'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API do Hub
const teams = new Map();
let gameTimer = null;

const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

function normalizeTeamName(name) { return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Team'; }

app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));

app.post('/api/team/login', (req, res) => {
  const name = normalizeTeamName(req.body.name);
  if (!teams.has(name)) {
    teams.set(name, { id: name, name, token: 'tk-' + Math.random().toString(36).slice(2), score: 0, completedRooms: [], room: 'room1', updatedAt: Date.now() });
  }
  res.json({ ok: true, team: teams.get(name) });
});

app.post('/api/team/update', (req, res) => {
  const { name, completedRoom, room, result, sourceCode } = req.body;
  const team = teams.get(normalizeTeamName(name));
  if (team) {
    if (room) team.room = room;
    if (result) team.lastResult = result;
    if (completedRoom && !team.completedRooms.includes(completedRoom)) {
      team.completedRooms.push(completedRoom);
      team.score += ROOM_POINTS[completedRoom] || 0;
    }
    team.updatedAt = Date.now();
  }
  res.json({ ok: true, team });
});

server.listen(PORT, () => {
  console.log(`🚀 HUB (API CENTRAL) ONLINE NA PORTA ${PORT}`);
});
