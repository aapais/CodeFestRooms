const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const { InvoiceEngine } = require('./invoiceEngine');
const { createProxyMiddleware } = require('http-proxy-middleware');

const fs = require('fs');

const app = express();

// Proxy API requests to the Central Hub (port 4000)
app.use('/api/team', createProxyMiddleware({ target: 'http://127.0.0.1:4000', changeOrigin: true }));
app.use('/api/state', createProxyMiddleware({ target: 'http://127.0.0.1:4000', changeOrigin: true }));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.get('/api/source', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, 'invoiceEngine.js'), 'utf8');
    res.json({ ok: true, source });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/invoice', (req, res) => {
  const startTime = Date.now();
  console.log(`[DEBUG] Handling invoice request. File: ${__filename}`);
  console.log(`[DEBUG] startTime defined as: ${startTime}`);

  try {
    const { items } = req.body;
    // Mock user context (since visual dashboard is anonymous)
    const user = { id: 'visual-user', flags: { enableVip: true } };
    const order = { items, ...(req.body) }; // Merge rest of body as order props

    // Call legacy engine
    const invoice = new InvoiceEngine().generateInvoice(order, user);

    // In a real refactor, this artificial delay would be removed or optimized
    if (JSON.stringify(invoice).length > 200) {
      // Fake logic: if result is complex, add delay simulating "heavy calculation"
    }

    res.json({
      ok: true,
      invoice,
      meta: {
        timeMs: Date.now() - startTime,
        complexityWarn: 'High CPU usage detected'
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/validate-complexity', (req, res) => {
  // Run linter with colors disabled for predictable output
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };

  exec('npm run complexity -- --no-color', { cwd: path.join(__dirname, '..'), env }, (error, stdout, stderr) => {
    const rawOutput = (stdout || '') + (stderr || '');

    // Remove ANSI escape sequences and control chars (keep newlines and tabs)
    let cleanOutput = rawOutput.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    cleanOutput = cleanOutput.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');

    const complexityMatch = cleanOutput.match(/Method\s+'(\w+)'\s+has\s+a\s+complexity\s+of\s+(\d+)/);

    if (complexityMatch) {
      return res.json({
        ok: false,
        message: 'Complexity too high',
        details: `Method '${complexityMatch[1]}' is too complex (${complexityMatch[2]}). Maximum allowed is 10.`
      });
    }

    if (error) {
      return res.json({
        ok: false,
        message: 'Lint/quality checks failed',
        details: cleanOutput.substring(0, 500).trim()
      });
    }

    res.json({
      ok: true,
      message: 'Clean code achieved. Complexity is within limits.'
    });
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Invoice Engine (v2) running at http://localhost:${PORT}`);
});
