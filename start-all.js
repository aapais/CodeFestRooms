#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');

const processes = [];

// Kill existing processes on our ports
try {
  console.log('🧹 Cleaning up ports...');
  // This works on Linux/macOS (IDX environment)
  execSync('fuser -k 4000/tcp 3001/tcp 3002/tcp 3003/tcp 3004/tcp 2>/dev/null || true');
} catch (e) {
  // Ignore errors on Windows or if fuser is missing
}

function startProcess(name, command, args = [], port) {
  console.log(`🚀 Starting ${name} on port ${port}...`);
  const env = { ...process.env };
  delete env.PORT; // Clear IDX assigned port
  env.PORT = port;
  
  const proc = spawn(command, args, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env
  });
  
  proc.on('error', (err) => {
    console.error(`❌ ${name} error:`, err);
  });
  
  processes.push({ name, proc });
  return proc;
}

// Start all services
console.log('🎮 Starting Visual Escape Room Systems...\n');

startProcess('Game Hub', 'npm', ['run', 'start:hub'], '4000');

setTimeout(() => {
  console.log('⏳ Hub initialized. Starting rooms...');
  startProcess('Room 1', 'npm', ['run', 'start:room1'], '5001');
}, 5000); // 5s delay for Hub

setTimeout(() => {
  startProcess('Room 2', 'npm', ['run', 'start:room2'], '5002');
}, 8000);

setTimeout(() => {
  startProcess('Room 3', 'npm', ['run', 'start:room3'], '5003');
}, 11000);

setTimeout(() => {
  startProcess('Final Room', 'npm', ['run', 'start:final'], '5004');
}, 14000);

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
