#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

// Portos internos para as salas (escondidos atrás do Hub)
const HUB_PORT = 4000;
const ROOM_PORTS = [3001, 3002, 3003, 3004];

console.log('🧹 LIMPEZA DE SEGURANÇA: Matando processos antigos...');
[HUB_PORT, ...ROOM_PORTS].forEach(port => {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
  } catch (e) {}
});

function start(name, cmd, args, port) {
  console.log(`🚀 [${name}] a iniciar no porto ${port}...`);
  const env = { ...process.env, PORT: port };
  // Remove a variável global do IDX para evitar conflitos internos
  delete env.MONOSPACE_PORT;
  
  const proc = spawn(cmd, args, { 
    cwd: __dirname, 
    stdio: 'inherit', // Mostra os logs aqui no terminal
    shell: true, 
    env 
  });

  proc.on('error', (err) => console.error(`❌ [${name}] Falhou:`, err));
}

console.log('\n🎮 SISTEMA ESCAPE ROOM: INICIANDO TODOS OS SERVIDORES\n');
console.log('💡 DICA: Abre um novo terminal tab no IDX para continuares a escrever comandos.');

// 1. Iniciar o Hub (Proxy + API)
start('HUB', 'npm', ['run', 'start:hub'], HUB_PORT);

// 2. Iniciar as salas com pequenos delays para não sobrecarregar o CPU
setTimeout(() => start('ROOM 1', 'npm', ['run', 'start:room1'], 3001), 2000);
setTimeout(() => start('ROOM 2', 'npm', ['run', 'start:room2'], 3002), 4000);
setTimeout(() => start('ROOM 3', 'npm', ['run', 'start:room3'], 3003), 6000);
setTimeout(() => start('FINAL', 'npm', ['run', 'start:final'], 3004), 8000);

process.on('SIGINT', () => {
  console.log('\n🛑 A desligar todos os sistemas...');
  process.exit(0);
});
