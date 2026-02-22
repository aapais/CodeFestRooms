'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const legacyService = require('./legacyService');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging for debug
app.use((req, res, next) => {
  console.log(`[ROOM1_LOG] ${req.method} ${req.url}`);
  next();
});

// Proxy API requests to the Central Hub (port 4000)
// Must be BEFORE any body parsers
app.use('/api/team', createProxyMiddleware({ target: 'http://127.0.0.1:4000', changeOrigin: true }));
app.use('/api/state', createProxyMiddleware({ target: 'http://127.0.0.1:4000', changeOrigin: true }));
app.use('/api/timer', createProxyMiddleware({ target: 'http://127.0.0.1:4000', changeOrigin: true }));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Initialize store with some data
if (process.env.NODE_ENV !== 'test') {
  legacyService.createUser('Alice', 'secret123', { isAdmin: true });
}

app.get('/api/source', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, 'legacyService.js'), 'utf8');
    res.json({ ok: true, source });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = legacyService.authenticate(username, password);
  res.json(result);
});

app.post('/api/checkout', (req, res) => {
  try {
    const { token, items, shippingAddress, discountCode } = req.body;
    const result = legacyService.placeOrder(token, {
      items,
      shippingAddress,
      discountCode,
      currency: 'EUR'
    });
    res.json(result);
  } catch (e) {
    console.error('[ROOM1_ERR] Checkout failed:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Room 1 Server running on port ${PORT}`);
  });
}

module.exports = app;
