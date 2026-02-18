'use strict';

const fs = require('fs');
const path = require('path');
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

// Import invoice logic
const engine = require('../../src/invoiceEngine');

app.post('/api/generate', (req, res) => {
  const { customer, items } = req.body;
  
  // Measure "slowness" / complexity visually
  const start = process.hrtime();
  
  let invoice;
  try {
     invoice = engine.generateInvoice(customer, items);
  } catch (err) {
      return res.status(500).json({ error: err.message });
  }
  
  const diff = process.hrtime(start);
  const ms = (diff[0] * 1000 + diff[1] / 1e6).toFixed(3);

  res.json({
    meta: { executionTimeMs: ms },
    invoice
  });
});

app.listen(PORT, () => {
    console.log(`Room 2 Visual Server running at http://localhost:${PORT}`);
});
