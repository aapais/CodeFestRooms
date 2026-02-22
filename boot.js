const { spawn } = require('child_process');

console.log('=== STARTING WORKSHOP SERVER ===');

const proc = spawn('node', ['game-hub/server.js'], { 
  cwd: __dirname, 
  stdio: 'inherit', 
  shell: true,
  env: Object.assign({}, process.env, { PORT: '4000' })
});

console.log('\n🚀 SERVIDOR INICIADO NA PORTA 4000');
console.log('1. Procura a aba "PORTS" no painel inferior do IDX.');
console.log('2. Procura a porta 4000.');
console.log('3. Clica no ícone do globo (Open in Browser).\n');

proc.on('error', (err) => {
  console.error('Falha ao iniciar:', err);
});
