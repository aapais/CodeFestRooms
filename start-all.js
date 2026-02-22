#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const processes = [];

function startProcess(name, command, args = [], envOverrides = {}) {
  console.log(`🚀 Starting ${name}...`);
  const proc = spawn(command, args, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...envOverrides }
  });
  
  proc.on('error', (err) => {
    console.error(`❌ ${name} error:`, err);
  });
  
  processes.push({ name, proc });
  return proc;
}

// Start all services
console.log('🎮 Starting Visual Escape Room...\n');

startProcess('Game Hub', 'npm', ['run', 'start:hub']);

setTimeout(() => {
  startProcess('Room 1', 'npm', ['run', 'start:room1'], { PORT: '3001' });
}, 2000);

setTimeout(() => {
  startProcess('Room 2', 'npm', ['run', 'start:room2'], { PORT: '3002' });
}, 4000);

setTimeout(() => {
  startProcess('Room 3', 'npm', ['run', 'start:room3'], { PORT: '3003' });
}, 6000);

setTimeout(() => {
  startProcess('Final Room', 'npm', ['run', 'start:final'], { PORT: '3004' });
}, 8000);

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(({ name, proc }) => {
    console.log(`  Stopping ${name}...`);
    proc.kill();
  });
  process.exit(0);
});

console.log('\n✅ All services starting...');
console.log('📍 Game Hub will be at http://localhost:4000');
console.log('💡 Press Ctrl+C to stop all services\n');
