'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const legacyService = require('./legacyService');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy API requests to the Central Hub (port 4000)
app.use('/api/team', createProxyMiddleware({ target: 'http://localhost:4000', changeOrigin: true }));
app.use('/api/state', createProxyMiddleware({ target: 'http://localhost:4000', changeOrigin: true }));

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

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
  const { token, cart, shippingAddress, discountCode } = req.body;
  const result = legacyService.placeOrder(token, {
    items: cart,
    shippingAddress,
    discountCode,
    currency: 'EUR'
  });
  res.json(result);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Room 1 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
