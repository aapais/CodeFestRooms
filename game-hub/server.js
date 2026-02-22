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
const CLOUD_API_URL = 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';

// 1. PRIMEIRO: Ler o JSON para podermos processar os dados
app.use(express.json());

// 2. SEGUNDO: Configurar o Túnel para a Cloud
// Isto envia o progresso das equipas do IDX para o Dashboard Master
app.use('/api', createProxyMiddleware({
  target: CLOUD_API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // IMPORTANTE: Como lemos o JSON acima, temos de o escrever de volta no túnel
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

// 3. TERCEIRO: Proxy para as Salas (Conteúdo Local)
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

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => {
  console.log(`🚀 HUB DE SINCRONIZAÇÃO ATUALIZADO (Porta ${PORT})`);
  console.log(`📡 Sincronizando com: ${CLOUD_API_URL}`);
});
