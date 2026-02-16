# =========================================
# SETUP CLOUDFLARE TUNNEL (Alternativa a Ngrok)
# =========================================
# Este script configura Cloudflare Tunnel como alternativa segura a ngrok
# Funciona mesmo quando ngrok está bloqueado!

$ErrorActionPreference = "Stop"

Write-Host "
╔═════════════════════════════════════════╗
║  🌐 Cloudflare Tunnel Setup             ║
║   (Alternativa a Ngrok)                 ║
╚═════════════════════════════════════════╝
" -ForegroundColor Cyan

# ========== PRÉ-REQUISITOS ==========
Write-Host "[1/3] Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Cloudflared
try {
    $cloudPath = (Get-Command cloudflared -ErrorAction Stop).Source
    Write-Host "✅ Cloudflared instalado: $cloudPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Cloudflared NÃO está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala com:" -ForegroundColor Yellow
    Write-Host "  choco install cloudflare-wrangler" -ForegroundColor Gray
    Write-Host "  OU" -ForegroundColor Gray
    Write-Host "  winget install Cloudflare.cloudflared" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois executa este script novamente!" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
try {
    $nodeVer = node --version
    Write-Host "✅ Node.js instalado: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js NÃO está instalado!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========== CRIAR CONFIG CLOUDFLARE ==========
Write-Host "[2/3] Criando ficheiro de configuração..." -ForegroundColor Yellow

# Criar diretório cloudflared se não existir
$cloudflareDir = "$HOME\.cloudflared"
if (!(Test-Path $cloudflareDir)) {
    New-Item -ItemType Directory -Path $cloudflareDir -Force | Out-Null
    Write-Host "✅ Diretório criado: $cloudflareDir" -ForegroundColor Green
}

# Criar config.yml
$configPath = "$cloudflareDir\config.yml"
$configContent = @"
# Cloudflare Tunnel Config para Visual Escape Room

tunnel: gameroom-visual
credentials-file: `$HOME\.cloudflared\gameroom-visual.json

ingress:
  - hostname: gameroom-visual.pages.dev
    service: http://localhost:4000
  - hostname: gameroom-room1.pages.dev
    service: http://localhost:3000
  - hostname: gameroom-room2.pages.dev
    service: http://localhost:3002
  - hostname: gameroom-room3.pages.dev
    service: http://localhost:3003
  - hostname: gameroom-final.pages.dev
    service: http://localhost:8080
  - service: http_status:404
"@

$configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force
Write-Host "✅ Config criado: $configPath" -ForegroundColor Green

Write-Host ""

# ========== INSTRUÇÕES ==========
Write-Host "[3/3] Próximos passos:" -ForegroundColor Yellow
Write-Host ""

Write-Host "PASSO 1: Criar/Autenticar Túnel" -ForegroundColor Cyan
Write-Host "  cloudflared tunnel login" -ForegroundColor Gray
Write-Host "  (Abre browser para autenticar com Cloudflare)" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 2: Criar Túnel" -ForegroundColor Cyan
Write-Host "  cloudflared tunnel create gameroom-visual" -ForegroundColor Gray
Write-Host "  (Nota o UUID que aparece)" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 3: Inicia Túnel (1 terminal)" -ForegroundColor Cyan
Write-Host "  cloudflared tunnel run gameroom-visual" -ForegroundColor Gray
Write-Host "  (Mantém aberto)" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 4: Inicia Servidores Node (5 terminais)" -ForegroundColor Cyan
Write-Host "  Terminal 1: cd game-hub;               npm start" -ForegroundColor Gray
Write-Host "  Terminal 2: cd rooms\room1-archaeology; npm start" -ForegroundColor Gray
Write-Host "  Terminal 3: cd rooms\room2-refactor-lab; npm start" -ForegroundColor Gray
Write-Host "  Terminal 4: cd rooms\room3-security-vault; npm start" -ForegroundColor Gray
Write-Host "  Terminal 5: cd rooms\final-modernisation; npm start" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 5: URLs Públicas" -ForegroundColor Cyan
Write-Host "  Game Hub:    https://gameroom-visual.pages.dev (leaderboard)" -ForegroundColor Green
Write-Host "  Room 1:      https://gameroom-room1.pages.dev" -ForegroundColor Green
Write-Host "  Room 2:      https://gameroom-room2.pages.dev" -ForegroundColor Green
Write-Host "  Room 3:      https://gameroom-room3.pages.dev" -ForegroundColor Green
Write-Host "  Final:       https://gameroom-final.pages.dev" -ForegroundColor Green
Write-Host ""

Write-Host "PASSO 6: Atualizar config.js" -ForegroundColor Cyan
Write-Host "  Em config-ngrok.js, muda para os URLs acima" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Cloudflare Tunnel pronto!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Para mais detalhes:" -ForegroundColor Yellow
Write-Host "   Vê ALTERNATIVAS_NGROK.md" -ForegroundColor Gray
Write-Host ""
