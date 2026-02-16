# =========================================
# SETUP NGROK PARA VISUAL ESCAPE ROOM
# =========================================
# Este script configura túneis ngrok para rede corporativa
# com múltiplos computadores

$ErrorActionPreference = "Stop"

Write-Host "
╔════════════════════════════════════════╗
║  🌐 NGROK Setup - Visual Escape Room  ║
║   (Rede Corporativa Multi-Máquinas)   ║
╚════════════════════════════════════════╝
" -ForegroundColor Cyan

# ========== PRÉ-REQUISITOS ==========
Write-Host "[1/4] Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar ngrok
try {
    $null = ngrok --version 2>$null
    Write-Host "✅ ngrok instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok NÃO está instalado!" -ForegroundColor Red
    Write-Host "   Instala: choco install ngrok" -ForegroundColor Yellow
    Write-Host "   Ou: npm install -g ngrok" -ForegroundColor Yellow
    Write-Host "   Depois: ngrok config add-authtoken <TOKEN>" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
try {
    $null = node --version 2>$null
    Write-Host "✅ Node.js instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js NÃO está instalado!" -ForegroundColor Red
    exit 1
}


Write-Host ""

# ========== CRIAR CONFIG FILES ==========
Write-Host "[2/4] Criando ficheiros de configuração..." -ForegroundColor Yellow

# Copiar template para config-ngrok.js
Copy-Item "config-ngrok.template.js" "config-ngrok.js" -Force
Write-Host "✅ Criado config-ngrok.js (edita com teus URLs)" -ForegroundColor Green

Write-Host ""

# ========== INFORMAÇÕES DE SETUP ==========
Write-Host "[3/4] Instruções para Ngrok..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para usar ngrok, tens DUAS OPÇÕES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPÇÃO A: Iniciar túneis em terminais separados (Recomendado)" -ForegroundColor Green
Write-Host "  1. Abre 2 PowerShell/CMD:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (Hub - porta 4000):" -ForegroundColor Cyan
Write-Host "    ngrok http 4000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Rooms - múltiplas portas):" -ForegroundColor Cyan
Write-Host "    ngrok http 3000 3002 3003 8080" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Ngrok vai mostrar os URLs públicos! Guarda-os (ou tira screenshot)" -ForegroundColor White
Write-Host ""

Write-Host "OPÇÃO B: Usar ficheiro ngrok.yml (mais profissional)" -ForegroundColor Green
Write-Host "  Edita ~/.ngrok2/ngrok.yml com:" -ForegroundColor White
Write-Host ""
Write-Host "    version: 2" -ForegroundColor Gray
Write-Host "    authtoken: SEU_TOKEN_AQUI" -ForegroundColor Gray
Write-Host "    tunnels:" -ForegroundColor Gray
Write-Host "      hub:" -ForegroundColor Gray
Write-Host "        proto: http" -ForegroundColor Gray
Write-Host "        addr: 4000" -ForegroundColor Gray
Write-Host "      room1:" -ForegroundColor Gray
Write-Host "        proto: http" -ForegroundColor Gray
Write-Host "        addr: 3000" -ForegroundColor Gray
Write-Host "      room2:" -ForegroundColor Gray
Write-Host "        proto: http" -ForegroundColor Gray
Write-Host "        addr: 3002" -ForegroundColor Gray
Write-Host "      room3:" -ForegroundColor Gray
Write-Host "        proto: http" -ForegroundColor Gray
Write-Host "        addr: 3003" -ForegroundColor Gray
Write-Host "      final:" -ForegroundColor Gray
Write-Host "        proto: http" -ForegroundColor Gray
Write-Host "        addr: 8080" -ForegroundColor Gray
Write-Host ""
Write-Host "  Depois: ngrok start --all" -ForegroundColor White
Write-Host ""

Write-Host ""

# ========== PRÓXIMOS PASSOS ==========
Write-Host "[4/4] Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🌐 Inicia os túnels ngrok (vê opções acima)" -ForegroundColor White
Write-Host ""
Write-Host "2. 📝 Copia os URLs públicos de ngrok para config-ngrok.js:" -ForegroundColor White
Write-Host "   Exemplo:" -ForegroundColor Gray
Write-Host "     GAME_HUB_URL:  'https://abc123.ngrok-free.app'" -ForegroundColor Gray
Write-Host "     ROOM1_URL:     'https://def456.ngrok-free.app'" -ForegroundColor Gray
Write-Host "     ROOM2_URL:     'https://ghi789.ngrok-free.app'" -ForegroundColor Gray
Write-Host "     ROOM3_URL:     'https://jkl012.ngrok-free.app'" -ForegroundColor Gray
Write-Host "     FINAL_URL:     'https://mno345.ngrok-free.app'" -ForegroundColor Gray
Write-Host "     WS_URL:        'wss://abc123.ngrok-free.app'" -ForegroundColor Gray
Write-Host ""

Write-Host "3. 🚀 Inicia os servidores Node.js (5 terminais):" -ForegroundColor White
Write-Host "    Terminal 1: cd game-hub;                npm start" -ForegroundColor Gray
Write-Host "    Terminal 2: cd rooms\room1-archaeology;  npm start" -ForegroundColor Gray
Write-Host "    Terminal 3: cd rooms\room2-refactor-lab;  npm start" -ForegroundColor Gray
Write-Host "    Terminal 4: cd rooms\room3-security-vault; npm start" -ForegroundColor Gray
Write-Host "    Terminal 5: cd rooms\final-modernisation; npm start" -ForegroundColor Gray
Write-Host ""

Write-Host "4. 🎮 Partilha os URLs de ngrok com as equipas!" -ForegroundColor White
Write-Host "   Via QR codes, email, ou num papel" -ForegroundColor Gray
Write-Host ""
Write-Host "   Exemplo:" -ForegroundColor Gray
Write-Host "     Equipa A: https://def456.ngrok-free.app (Room 1)" -ForegroundColor Gray
Write-Host "     Equipa B: https://ghi789.ngrok-free.app (Room 2)" -ForegroundColor Gray
Write-Host "     Você:     https://abc123.ngrok-free.app (Hub Leaderboard)" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Setup concluído! Bom jogo! 🎮" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dúvidas? Vê SETUP_NGROK.md para mais detalhes!" -ForegroundColor Yellow
Write-Host ""
