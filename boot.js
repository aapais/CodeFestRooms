const { spawn, execSync } = require('child_process');

console.log('🔥 MODO DE EMERGÊNCIA ATIVADO 🔥');

// 1. Matar tudo o que mexe nas portas antigas
try {
  console.log('💀 A limpar processos zombies...');
  execSync('fuser -k 3000/tcp 4000/tcp 5000/tcp 8080/tcp 9000/tcp 9002/tcp 2>/dev/null || true');
} catch (e) {}

// 2. Lançar o servidor na porta 8080 (A mais segura do Google Cloud)
console.log('🚀 A levantar servidor na porta 8080...');
const env = { ...process.env, PORT: '8080' };

const proc = spawn('node', ['game-hub/server.js'], { 
  cwd: __dirname, 
  stdio: 'inherit', 
  shell: true,
  env
});

console.log('
✅ SERVIDOR NO AR!');
console.log('👉 CLICA EM "OPEN BROWSER" OU NO GLOBO 🌐');
console.log('👉 SE O PREVIEW NÃO ABRIR AUTOMATICAMENTE, PROCURA A PORTA 8080 NA ABA "PORTS"');
