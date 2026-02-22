#!/usr/bin/env node
const { spawn, execSync } = require('child_process');

console.log('🧹 Limpando ambiente...');
try { execSync('fuser -k 4000/tcp 2>/dev/null || true'); } catch (e) {}

console.log('🎮 A iniciar servidor do Workshop...');
const env = { ...process.env, PORT: 4000 };
spawn('node', ['game-hub/server.js'], { cwd: __dirname, stdio: 'inherit', shell: true, env });
