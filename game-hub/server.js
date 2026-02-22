'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// FORÇAR PORTA DO HUB (O IDX vai mapear isto para a URL de preview)
const PORT = process.env.PORT || 4000;

console.log(`[INIT] Game Hub a iniciar na porta ${PORT}`);

// --- REVERSE PROXY CONFIG (Portas Fixas 5001-5004) ---

app.use('/room1', createProxyMiddleware({
  target: 'http://127.0.0.1:5001',
  changeOrigin: true,
  pathRewrite: { '^/room1': '' },
  onError: (err, req, res) => {
    console.error('[PROXY_ERR] Room 1 (5001) inacessível');
    res.status(502).send('Sala 1 ainda a iniciar... Aguarda 10s e faz Refresh.');
  }
}));

app.use('/room2', createProxyMiddleware({
  target: 'http://127.0.0.1:5002',
  changeOrigin: true,
  pathRewrite: { '^/room2': '' },
  onError: (err, req, res) => {
    console.error('[PROXY_ERR] Room 2 (5002) inacessível');
    res.status(502).send('Sala 2 ainda a iniciar... Aguarda 10s e faz Refresh.');
  }
}));

app.use('/room3', createProxyMiddleware({
  target: 'http://127.0.0.1:5003',
  changeOrigin: true,
  pathRewrite: { '^/room3': '' },
  onError: (err, req, res) => {
    console.error('[PROXY_ERR] Room 3 (5003) inacessível');
    res.status(502).send('Sala 3 ainda a iniciar... Aguarda 10s e faz Refresh.');
  }
}));

app.use('/final', createProxyMiddleware({
  target: 'http://127.0.0.1:5004',
  changeOrigin: true,
  pathRewrite: { '^/final': '' },
  onError: (err, req, res) => {
    console.error('[PROXY_ERR] Final Room (5004) inacessível');
    res.status(502).send('Sala Final ainda a iniciar... Aguarda 10s e faz Refresh.');
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints
const teams = new Map();
app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.post('/api/team/login', (req, res) => {
  const name = req.body.name || 'Team';
  const team = { name, token: 'tk-' + Math.random().toString(36).slice(2), score: 0, completedRooms: [], updatedAt: Date.now() };
  teams.set(name, team);
  res.json({ ok: true, team });
});
app.post('/api/team/update', (req, res) => {
  const { name, completedRoom } = req.body;
  const team = teams.get(name);
  if (team && completedRoom && !team.completedRooms.includes(completedRoom)) {
    team.completedRooms.push(completedRoom);
    team.score += 100;
  }
  res.json({ ok: true });
});

server.listen(PORT, () => {
  console.log(`✅ HUB ONLINE EM http://localhost:${PORT}`);
});
