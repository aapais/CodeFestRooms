'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- BASE DE DADOS EM MEMÓRIA ---
const teams = new Map();
let gameTimer = null;

// --- SERVIR FRONTENDS ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/room1', express.static(path.join(__dirname, '../rooms/room1-archaeology/public')));
app.use('/room2', express.static(path.join(__dirname, '../rooms/room2-refactor-lab/public')));
app.use('/room3', express.static(path.join(__dirname, '../rooms/room3-security-vault/public')));
app.use('/final', express.static(path.join(__dirname, '../rooms/final-modernisation/public')));

// --- API DE SINCRONIZAÇÃO ---
app.get('/api/state', (req, res) => res.json({ ok: true, teams: Array.from(teams.values()) }));
app.get('/api/timer', (req, res) => res.json({ ok: true, timer: gameTimer }));
app.post('/api/kickoff', (req, res) => { gameTimer = { startTime: Date.now(), duration: 50 * 60 * 1000 }; res.json({ ok: true, startTime: gameTimer.startTime }); });
app.post('/api/team/login', (req, res) => {
  const name = req.body.name || 'Operative';
  if (!teams.has(name)) {
    teams.set(name, { name, token: 'tk-' + Math.random().toString(36).slice(2), score: 0, completedRooms: [], room: 'room1', updatedAt: Date.now() });
  }
  res.json({ ok: true, team: teams.get(name) });
});
app.post('/api/team/update', (req, res) => {
  const { name, completedRoom, room } = req.body;
  const team = teams.get(name);
  if (team) {
    if (room) team.room = room;
    if (completedRoom && !team.completedRooms.includes(completedRoom)) {
      team.completedRooms.push(completedRoom);
      team.score += 100;
    }
    team.updatedAt = Date.now();
  }
  res.json({ ok: true });
});

// --- API ROOM 1 ---
app.post('/room1/api/login', (req, res) => res.json({ ok: true }));
app.post('/room1/api/checkout', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8');
    const sandbox = { module: { exports: {} }, require: (m) => m === 'crypto' ? crypto : {}, console };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    const svc = sandbox.module.exports;
    svc.createUser('U', 'P');
    const auth = svc.authenticate('U', 'P');
    res.json(svc.placeOrder(auth.token, { items: [{ sku: 'MB', qty: 2, priceCents: 100000 }], discountCode: 'WELCOME10', shippingAddress: { country: 'PT' } }));
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/room1/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room1-archaeology/src/legacyService.js'), 'utf8') }));

// --- API ROOM 2 ---
app.post('/room2/api/invoice', (req, res) => {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8');
    const sandbox = { module: { exports: {} }, console };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    const engine = new sandbox.module.exports.InvoiceEngine();
    const invoice = engine.generateInvoice(req.body, { tier: 'VIP' });
    res.json({ ok: true, invoice });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/room2/api/validate-complexity', (req, res) => {
  // Corremos o eslint com threshold 1 para apanhar TODOS os valores
  exec('npx eslint src/invoiceEngine.js --rule "complexity: [\'warn\', 1]" --format json', { cwd: path.join(__dirname, '../rooms/room2-refactor-lab') }, (err, stdout) => {
    try {
      const results = JSON.parse(stdout);
      const messages = results[0].messages.filter(m => m.ruleId === 'complexity');
      
      let maxComp = 0;
      let worstFunc = '';
      messages.forEach(m => {
        const comp = parseInt(m.message.match(/complexity of (\d+)/)[1]);
        if (comp > maxComp) {
          maxComp = comp;
          worstFunc = m.message.match(/Method '(\w+)'/)[1];
        }
      });

      const totalFuncs = messages.length;

      if (maxComp > 10) {
        return res.json({ 
          ok: false, 
          message: `COMPLEXIDADE ALTA: ${maxComp}`, 
          details: `A função '${worstFunc}' está demasiado complexa. O limite é 10.` 
        });
      }

      res.json({ 
        ok: true, 
        message: `CÓDIGO LIMPO! Complexidade Máxima: ${maxComp}`, 
        details: `Total de funções no ficheiro: ${totalFuncs}. Excelente trabalho de refatorização!` 
      });

    } catch (e) {
      res.json({ ok: false, message: "Erro ao ler scanner.", details: "Garante que o código não tem erros de sintaxe." });
    }
  });
});
app.get('/room2/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room2-refactor-lab/src/invoiceEngine.js'), 'utf8') }));

// --- API ROOM 3 ---
app.post('/room3/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && (password.includes("' OR '1'='1") || password === 'secret')) return res.json({ ok: true, msg: "🔓 ACCESS GRANTED" });
  res.json({ ok: false, msg: "Denied" });
});
app.get('/room3/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/room3-security-vault/src/userRepo.js'), 'utf8') }));

// --- API FINAL ---
app.get('/final/status', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.post('/final/api/score', (req, res) => res.json({ ok: true, score: 850, risk: "LOW" }));
app.get('/final/api/source', (req, res) => res.json({ ok: true, source: fs.readFileSync(path.join(__dirname, '../rooms/final-modernisation/src/monolith.js'), 'utf8') }));

app.listen(PORT, () => console.log(`🚀 WORKSHOP SERVER ONLINE ON PORT ${PORT}`));
