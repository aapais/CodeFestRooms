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

// Validation endpoint for hybrid flow
app.get('/api/validate-iva', (req, res) => {
  try {
    svc.resetAllForTestsOnly();
    svc.createUser('Carla', 'pw');
    const auth = svc.authenticate('Carla', 'pw');
    if (!auth.ok) {
      return res.status(400).json({ ok: false, message: 'Auth failed' });
    }

    const order = svc.placeOrder(auth.token, {
      currency: 'EUR',
      discountCode: 'WELCOME10',
      items: [
        { sku: 'A', qty: 2, priceCents: 1000 }
      ],
      shippingAddress: { country: 'PT' }
    });

    if (!order.ok) {
      return res.status(400).json({ ok: false, message: order.error || 'Order failed' });
    }

    const actualTax = order.order.amounts.taxCents;
    const expectedTax = 518;

    if (actualTax !== expectedTax) {
      return res.json({
        ok: false,
        message: `IVA incorreto (esperado ${expectedTax}, obtido ${actualTax}).`,
        expectedTax,
        actualTax
      });
    }

    return res.json({ ok: true, message: 'IVA correto', expectedTax, actualTax });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || 'Validation error' });
  }
});

app.listen(PORT, () => {
  console.log(`Room 1 Visual Server running at http://localhost:${PORT}`);
});
