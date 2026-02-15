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
  // Alteração: FORCE_COLOR=0 para garantir que libs como chalk/eslint não emitam cores
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };
  
  exec('npm run complexity', { cwd: path.join(__dirname, '..'), env }, (error, stdout, stderr) => {
    // 1. Unifica stdout e stderr
    const rawOutput = (stdout || '') + (stderr || '');
    
    // 2. Debug para ver o que realmente estamos recebendo (no console do servidor)
    console.log('[RAW OUT len]:', rawOutput.length); 

    // 3. Limpeza Extrema de ANSI:
    // Remove qualquer sequencia que comece com ESC [ e termine com letra
    // eslint-disable-next-line no-control-regex
    let cleanOutput = rawOutput.replace(/\x1B\[[0-9;]*[mGK]/g, '');
    
    // Remove também caracteres de controle ASCII genéricos que não sejam newline/tab
    // eslint-disable-next-line no-control-regex
    cleanOutput = cleanOutput.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');

    console.log('[CLEAN OUT]:', cleanOutput.substring(0, 100));

    // 4. Procura padrao de complexidade
    // Tentativa de match flexível (ignorando espaços extras que a limpeza pode ter deixado)
    const complexityMatch = cleanOutput.match(/Method\s+'(\w+)'\s+has\s+a\s+complexity\s+of\s+(\d+)/);
    
    if (complexityMatch) {
         return res.json({
            ok: false,
            message: "⚠️ Complexity Too High",
            details: `Method '${complexityMatch[1]}' is too complex (${complexityMatch[2]}). Maximum allowed is 10.`
        });
    }

    if (error) {
         // Se não achou a msg específica, retorna o log limpo (truncado)
         return res.json({ 
            ok: false, 
            message: "⚠️ Lint/Quality Checks Failed",
            details: cleanOutput.substring(0, 500).trim() 
        });
    }

    // Sucesso
    res.json({ 
      ok: true, 
      message: "✅ Clean Code Achieved! Complexity is within limits." 
    });
  });
    
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
