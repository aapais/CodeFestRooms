#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

console.log('🧹 LIMPEZA: Matando processos antigos na porta 4000...');
try {
  // Matar qualquer coisa que esteja na porta 4000
  execSync('fuser -k 4000/tcp 2>/dev/null || true');
} catch (e) {}

console.log('🎮 A iniciar servidor unificado do Escape Room...');
const proc = spawn('node', ['game-hub/server.js'], { 
  cwd: __dirname, 
  stdio: 'inherit', 
  shell: true 
});

process.on('SIGINT', () => { proc.kill(); process.exit(); });
