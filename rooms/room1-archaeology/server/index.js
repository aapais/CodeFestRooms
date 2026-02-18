'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple "server" that exposes Room 1 logic to the frontend
// and serves static files.
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve shared config files
app.get('/timingConfig.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../../shared/timingConfig.js'));
});
app.get('/config.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../../shared/config.js'));
});

// Import legacy logic (the exact same file used in tests)
const svc = require('../../src/legacyService');

// API to calculate cart
app.post('/api/checkout', (req, res) => {
  // Reset clean state for demo purposes (optional)
  svc.resetAllForTestsOnly();

  const { user, cart } = req.body;
  if (!user || !cart) return res.status(400).json({ error: 'Missing data' });

  // 1. Create & Auth User
  svc.createUser(user.username, user.password, { isAdmin: false });
  const auth = svc.authenticate(user.username, user.password);

  if (!auth.ok) return res.status(401).json({ error: auth.error });

  // 2. Place Order
  const orderRes = svc.placeOrder(auth.token, {
    currency: 'EUR',
    items: cart.items,
    shippingAddress: { country: 'PT' }
  });

  if (!orderRes.ok) return res.status(400).json({ error: orderRes.error });

  res.json(orderRes.order);
});

app.listen(PORT, () => {
  console.log(`Room 1 Visual Server running at http://localhost:${PORT}`);
});
