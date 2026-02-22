#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const PORTS = [4000, 3000, 3002, 3003, 8080];

console.log('🧹 LIMPEZA DE PORTAS...');
PORTS.forEach(port => {
  try { execSync(`fuser -k ${port}/tcp 2>/dev/null || true`); } catch (e) {}
});

function start(name, cmd, args, port) {
  const logFile = path.join(logDir, `${name.toLowerCase().replace(' ', '')}.log`);
  const out = fs.openSync(logFile, 'a');
  
  console.log(`🚀 [${name}] -> A iniciar em background (Porta ${port}). Logs em /logs`);
  
  const env = { ...process.env, PORT: port };
  const proc = spawn(cmd, args, { 
    cwd: __dirname, 
    detached: true, 
    stdio: ['ignore', out, out], 
    shell: true, 
    env 
  });
  
  proc.unref(); // Liberta o processo do loop do pai
}

console.log('\n🎮 SISTEMA ESCAPE ROOM: MODO BACKGROUND ATIVADO\n');

start('HUB', 'npm', ['run', 'start:hub'], '4000');
setTimeout(() => start('ROOM 1', 'npm', ['run', 'start:room1'], '3000'), 2000);
setTimeout(() => start('ROOM 2', 'npm', ['run', 'start:room2'], '3002'), 4000);
setTimeout(() => start('ROOM 3', 'npm', ['run', 'start:room3'], '3003'), 6000);
setTimeout(() => start('FINAL', 'npm', ['run', 'start:final'], '8080'), 8000);

console.log('\n✅ Todos os sistemas foram lançados com sucesso.');
console.log('💡 Podes continuar a usar este terminal.');
process.exit(0);
