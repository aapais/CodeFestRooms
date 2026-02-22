const { spawn, execSync } = require('child_process');

console.log('=== EMERGENCY BOOT ACTIVATED ===');

// 1. Clean up ports
try {
  console.log('Cleaning up old processes...');
  // Kill processes on ports 3000, 4000, 5000, 8080, 9000, 9002
  execSync('fuser -k 3000/tcp 4000/tcp 5000/tcp 8080/tcp 9000/tcp 9002/tcp 2>/dev/null || true');
} catch (e) {
  console.log('Port cleanup skipped or not needed.');
}

// 2. Start server on 8080
console.log('Starting server on port 8080...');
const env = Object.assign({}, process.env, { PORT: '8080' });

const proc = spawn('node', ['game-hub/server.js'], { 
  cwd: __dirname, 
  stdio: 'inherit', 
  shell: true,
  env: env
});

console.log('SERVER STARTED SUCCESSFULLY');
console.log('CLICK ON WEB PREVIEW (PORT 8080)');

proc.on('error', (err) => {
  console.error('Failed to start server:', err);
});
