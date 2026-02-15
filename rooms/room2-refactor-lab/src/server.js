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
  // Executa o linter com flag --no-color para facilitar parsing
  // O '--' passa o argumento para o script 'complexity' (que é o eslint)
  exec('npm run complexity -- --no-color', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    const rawOutput = (stdout || '') + (stderr || '');
    
    // Mesmo com --no-color, alguns ambientes forçam cor. Mantemos a limpeza como garantia.
    // eslint-disable-next-line no-control-regex
    const cleanOutput = rawOutput.replace(/\x1B\[\d+;?\d*m/g, '').replace(/\[\d+m/g, '');

    // Debug no terminal do servidor para saber o que está chegando
    console.log('[DEBUG LINT OUTPUT]:', cleanOutput.substring(0, 100)); 

    // 2. Search for the complexity message in clean text
    const match = cleanOutput.match(/Method\s+'(\w+)'\s+has\s+a\s+complexity\s+of\s+(\d+)/);
    
    if (match) {
        return res.json({
            ok: false,
            message: "⚠️ Complexity Too High",
            details: `Method '${match[1]}' is too complex (${match[2]}). Maximum allowed is 10.`
        });
    }

    if (error) {
        return res.json({ 
            ok: false, 
            message: "⚠️ Lint/Quality Checks Failed",
            details: cleanOutput.substring(0, 500).trim() // Clean log
        });
    }
    
    // Se não deu erro
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
