'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

// --- PROXY PARA AS SALAS (CONTEÚDO ESTÁTICO LOCAL) ---
const setupRoomProxy = (route, targetPort) => {
  app.use(route, createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    pathRewrite: { [`^${route}`]: '' },
    logLevel: 'error'
  }));
};

setupRoomProxy('/room1', 3001);
setupRoomProxy('/room2', 3002);
setupRoomProxy('/room3', 3003);
setupRoomProxy('/final', 3004);

// Servir ficheiros públicos do Hub
app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => {
  console.log(`🚀 HUB LOCAL ONLINE NA PORTA ${PORT}`);
  console.log(`📡 Nota: Este Hub agora apenas serve UI. As chamadas de API vão direto para a Cloud.`);
});
