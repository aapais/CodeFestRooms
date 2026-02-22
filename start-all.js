#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const path = require('path');

const processes = [];

// Kill existing processes
try {
  console.log('🧹 Cleaning up ports...');
  execSync('fuser -k 4000/tcp 3000/tcp 3002/tcp 3003/tcp 8080/tcp 2>/dev/null || true');
} catch (e) {}

function startProcess(name, command, args = [], port) {
  console.log(`🚀 Starting ${name} on port ${port}...`);
  const env = { ...process.env, PORT: port };
  const proc = spawn(command, args, { cwd: __dirname, stdio: 'inherit', shell: true, env });
  processes.push({ name, proc });
  return proc;
}

console.log('🎮 Starting Visual Escape Room Systems...\n');

startProcess('Game Hub', 'npm', ['run', 'start:hub'], '4000');

setTimeout(() => startProcess('Room 1', 'npm', ['run', 'start:room1'], '3000'), 2000);
setTimeout(() => startProcess('Room 2', 'npm', ['run', 'start:room2'], '3002'), 4000);
setTimeout(() => startProcess('Room 3', 'npm', ['run', 'start:room3'], '3003'), 6000);
setTimeout(() => startProcess('Final Room', 'npm', ['run', 'start:final'], '8080'), 8000);

process.on('SIGINT', () => {
  processes.forEach(({ name, proc }) => proc.kill());
  process.exit(0);
});
