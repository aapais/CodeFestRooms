#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

// Lista de portos que vamos usar + o porto fantasma 9002
const PORTS = [4000, 5001, 5002, 5003, 5004, 9000, 9001, 9002];

console.log('🧹 OPERAÇÃO LIMPEZA: Eliminando processos antigos...');
PORTS.forEach(port => {
  try {
    // Comando para Linux (IDX) para matar processos por porto
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
  } catch (e) {}
});

function start(name, cmd, args, port) {
  console.log(`🚀 [${name}] -> Porto ${port}`);
  const env = { ...process.env, PORT: port };
  // Importante: remover a variável PORT global do IDX para as salas não se baralharem
  if (port != 4000) delete env.PORT; 
  env.PORT = port;

  spawn(cmd, args, { cwd: __dirname, stdio: 'inherit', shell: true, env });
}

console.log('\n🎮 INICIANDO ESCAPE ROOM EM MODO TÚNEL ÚNICO...\n');

start('HUB', 'npm', ['run', 'start:hub'], '4000');

setTimeout(() => start('ROOM 1', 'npm', ['run', 'start:room1'], '5001'), 3000);
setTimeout(() => start('ROOM 2', 'npm', ['run', 'start:room2'], '5002'), 5000);
setTimeout(() => start('ROOM 3', 'npm', ['run', 'start:room3'], '5003'), 7000);
setTimeout(() => start('FINAL', 'npm', ['run', 'start:final'], '5004'), 9000);
