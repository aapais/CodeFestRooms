const express = require('express');
const path = require('path');
const { InvoiceEngine } = require('./invoiceEngine');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.post('/api/invoice', (req, res) => {
  const start = Date.now();
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
        timeMs: Date.now() - start,
        complexityWarn: "High CPU usage detected"
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🧾 Invoice Engine (v2) running at http://localhost:${PORT}`);
});
