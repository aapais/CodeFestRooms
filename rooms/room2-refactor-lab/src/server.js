const express = require('express');
const path = require('path');
const { InvoiceEngine } = require('./invoiceEngine');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

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
        complexityWarn: "High CPU usage detected"
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const { exec } = require('child_process');

app.get('/api/validate-complexity', (req, res) => {
  // Executa o linter para verificar a complexidade real do código refatorado
  exec('npm run complexity', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    // Remove códigos de cor ANSI (ex: [31m) para o texto ficar limpo no browser
    const cleanOutput = (stdout || stderr).replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    
    if (error) {
      // Se deu erro (exit code 1), significa que a complexidade ainda é alta ou tem lint errors
      return res.json({ 
        ok: false, 
        message: "⚠️ Code Complexity is too high!",
        details: cleanOutput
      });
    }
    // Se não deu erro, passou no teste
    res.json({ 
      ok: true, 
      message: "✅ Clean Code Achieved! Complexity is within limits." 
    });
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🧾 Invoice Engine (v2) running at http://localhost:${PORT}`);
});
