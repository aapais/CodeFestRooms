#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const path = require('path');

const processes = [];

try {
  console.log('🧹 Limpando sessões antigas...');
  execSync('fuser -k 4000/tcp 5001/tcp 5002/tcp 5003/tcp 5004/tcp 2>/dev/null || true');
} catch (e) {}

function start(name, cmd, args, port) {
  console.log(`🚀 [${name}] a iniciar na porta ${port}...`);
  const env = { ...process.env, PORT: port };
  const proc = spawn(cmd, args, { cwd: __dirname, stdio: 'inherit', shell: true, env });
  processes.push({ name, proc });
}

console.log('🎮 SISTEMA ESCAPE ROOM: INICIANDO TÚNEL ÚNICO...\n');

start('HUB', 'npm', ['run', 'start:hub'], '4000');

setTimeout(() => start('ROOM 1', 'npm', ['run', 'start:room1'], '5001'), 3000);
setTimeout(() => start('ROOM 2', 'npm', ['run', 'start:room2'], '5002'), 5000);
setTimeout(() => start('ROOM 3', 'npm', ['run', 'start:room3'], '5003'), 7000);
setTimeout(() => start('FINAL', 'npm', ['run', 'start:final'], '5004'), 9000);

process.on('SIGINT', () => {
  processes.forEach(p => p.proc.kill());
  process.exit(0);
});
