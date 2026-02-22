'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;

// --- PROXY PARA AS SALAS ---
// Isto permite que todo o workshop corra numa única porta (a do Hub)
// Evitando erros de CORS e de redireccionamento do Google IDX
const setupProxy = (route, targetPort) => {
  app.use(route, createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    pathRewrite: { [`^${route}`]: '' },
    logLevel: 'debug', // Ver logs no terminal do Hub
    onError: (err, req, res) => {
      console.error(`[PROXY_ERR] Sala na porta ${targetPort} não responde.`);
      res.status(502).send(`A Sala ${route} ainda está a iniciar. Aguarda 10 segundos e faz refresh.`);
    }
  }));
};

// Mapeamento de rotas para portos internos
setupProxy('/room1', 3001);
setupProxy('/room2', 3002);
setupProxy('/room3', 3003);
setupProxy('/final', 3004);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API do Hub
const teams = new Map();
let gameTimer = null;
const ROOM_POINTS = { room1: 100, room2: 150, room3: 150, final: 200 };

function normalizeTeamName(name) { return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Team'; }

app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));

app.post('/api/kickoff', (req, res) => {
  gameTimer = { startTime: Date.now(), duration: 50 * 60 * 1000, updatedAt: Date.now() };
  res.json({ ok: true, startTime: gameTimer.startTime });
});

app.post('/api/team/login', (req, res) => {
  const name = normalizeTeamName(req.body.name);
  if (!teams.has(name)) {
    teams.set(name, { name, token: Math.random().toString(36).slice(2), score: 0, completedRooms: [], room: 'room1', updatedAt: Date.now() });
  }
  res.json({ ok: true, team: teams.get(name) });
});

app.post('/api/team/update', (req, res) => {
  const { name, completedRoom, room, result } = req.body;
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
  res.json({ ok: true });
});

server.listen(PORT, () => {
  console.log(`🚀 ESCAPE ROOM HUB (API + PROXY) ONLINE NA PORTA ${PORT}`);
  console.log(`Acessível via caminhos: /room1, /room2, /room3, /final`);
});
