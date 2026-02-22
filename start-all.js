#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

console.log('🧹 Limpando sessões antigas...');
try {
  // Matar qualquer processo na porta 4000
  execSync('fuser -k 4000/tcp 2>/dev/null || true');
} catch (e) {}

console.log('🎮 A iniciar servidor do Escape Room...');
const proc = spawn('node', ['game-hub/server.js'], { 
  cwd: __dirname, 
  stdio: 'inherit', 
  shell: true 
});

process.on('SIGINT', () => { proc.kill(); process.exit(); });
