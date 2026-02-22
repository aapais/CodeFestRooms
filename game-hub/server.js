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

// URL DA TUA CLOUD (FONTE DA VERDADE)
const CLOUD_API_URL = 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';

// --- TÚNEL PARA A CLOUD (API CENTRAL) ---
// Todos os pedidos feitos a /api/ no IDX são enviados para o Firebase
app.use('/api', createProxyMiddleware({
  target: CLOUD_API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' }, // A Cloud Function já está mapeada em /api
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Garante que o body em JSON é passado corretamente
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

// --- PROXY PARA AS SALAS (CONTEÚDO LOCAL) ---
const setupRoomProxy = (route, targetPort) => {
  app.use(route, createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    pathRewrite: { [`^${route}`]: '' },
    logLevel: 'silent'
  }));
};

setupRoomProxy('/room1', 3001);
setupRoomProxy('/room2', 3002);
setupRoomProxy('/room3', 3003);
setupRoomProxy('/final', 3004);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Notificar via WebSocket quando houver mudanças (opcional, o dashboard usa polling)
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 HUB DE SINCRONIZAÇÃO ONLINE (Porta ${PORT})`);
  console.log(`📡 Ligado à Cloud: ${CLOUD_API_URL}`);
});
