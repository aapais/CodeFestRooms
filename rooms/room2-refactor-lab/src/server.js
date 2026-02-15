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
  // Executa o linter
  exec('npm run complexity', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    const rawOutput = (stdout || '') + (stderr || '');
    
    // 1. Tenta encontrar a mensagem específica de complexidade
    // Exemplo: "Method 'generateInvoice' has a complexity of 34"
    const complexityMatch = rawOutput.match(/Method\s+'(\w+)'\s+has\s+a\s+complexity\s+of\s+(\d+)/);
    
    if (complexityMatch) {
        return res.json({
            ok: false,
            message: "⚠️ Complexity Too High",
            details: `Method '${complexityMatch[1]}' is too complex (${complexityMatch[2]}). Maximum allowed is 10.`
        });
    }

    if (error) {
        // Se falhou mas não achamos o erro de complexidade, pode ser outro erro de lint
        // Vamos tentar limpar os códigos ANSI de forma mais agressiva para mostrar algo legível
        // eslint-disable-next-line no-control-regex
        const cleanLog = rawOutput.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
        
        return res.json({ 
            ok: false, 
            message: "⚠️ Lint/Quality Checks Failed",
            details: cleanLog.substring(0, 300) + "..." // Truncar para não poluir
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
