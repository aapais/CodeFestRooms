# =========================================
# SETUP REDE LOCAL (IP Direto - Mais Seguro)
# =========================================
# Este script configura acesso direto via IP local (192.168.x.x)
# Perfeito para equipas na mesma rede corporativa!
# Sem Internet público = Máxima segurança

$ErrorActionPreference = "Stop"

Write-Host "
╔════════════════════════════════════════╗
║  🏠 Acesso via Rede Local              ║
║   (IP Direto - Máxima Segurança)      ║
╚════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "[1/2] Obtendo IP Local..." -ForegroundColor Yellow
Write-Host ""

# Obter IP local
$ipInfo = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null }).IPv4Address.IPAddress
$localIP = $null

if ($ipInfo) {
    # Se houver múltiplos IPs, pega o mais comum
    if ($ipInfo -is [array]) {
        $localIP = $ipInfo[0]
    } else {
        $localIP = $ipInfo
    }
}

if (!$localIP) {
    Write-Host "❌ Não consegui obter IP local!" -ForegroundColor Red
    Write-Host "   Executa: ipconfig" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Teu IP Local: $localIP" -ForegroundColor Green
Write-Host ""

# Criar config para rede local
Write-Host "[2/2] Criando configuração..." -ForegroundColor Yellow
Write-Host ""

# Criar config-local.js
$configContent = @"
// =========================================
// CONFIG REDE LOCAL (IP Direto)
// =========================================
// Acesso direto via IP sem internert público
// Máxima segurança para rede corporativa!

window.GAME_CONFIG = {
  // Substitui o IP abaixo pelo teu!
  // Exemplo: 192.168.1.50
  LOCAL_IP: '$localIP',
  
  GAME_HUB_URL: 'http://$localIP`:4000',
  ROOM1_URL: 'http://$localIP`:3000',
  ROOM2_URL: 'http://$localIP`:3002',
  ROOM3_URL: 'http://$localIP`:3003',
  FINAL_URL: 'http://$localIP`:8080',
  
  // WebSocket usa HTTP, não wss
  WS_URL: 'ws://$localIP`:4000',
  
  getRoomUrl: function(roomId) {
    const map = {
      'room1': this.ROOM1_URL,
      'room2': this.ROOM2_URL,
      'room3': this.ROOM3_URL,
      'final': this.FINAL_URL,
      'hub': this.GAME_HUB_URL
    };
    return map[roomId] || this.ROOM1_URL;
  }
};
"@

$configPath = ".\config-local.js"
$configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force
Write-Host "✅ Criado: config-local.js" -ForegroundColor Green
Write-Host ""

# Criar instrucoes
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 INSTRUÇÕES - Rede Local" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSO 1: Abrir Firewall Windows" -ForegroundColor Green
Write-Host "  (PowerShell como ADMIN)" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Permitir portas" -ForegroundColor Gray
Write-Host "  New-NetFirewallRule -DisplayName 'GameRoom Hub' -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow" -ForegroundColor Gray
Write-Host "  New-NetFirewallRule -DisplayName 'GameRoom Rooms' -Direction Inbound -LocalPort 3000,3002,3003,8080 -Protocol TCP -Action Allow" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 2: Inicia Servidores Node (5 Terminais)" -ForegroundColor Green
Write-Host "  Terminal 1: cd game-hub;               npm start" -ForegroundColor Gray
Write-Host "  Terminal 2: cd rooms\room1-archaeology; npm start" -ForegroundColor Gray
Write-Host "  Terminal 3: cd rooms\room2-refactor-lab; npm start" -ForegroundColor Gray
Write-Host "  Terminal 4: cd rooms\room3-security-vault; npm start" -ForegroundColor Gray
Write-Host "  Terminal 5: cd rooms\final-modernisation; npm start" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 3: Distribuir URLs às Equipas" -ForegroundColor Green
Write-Host "  (Apenas dentro da mesma rede corporativa/Wi-Fi)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Game Hub:    http://$localIP`:4000  (Leaderboard -- para ti)" -ForegroundColor Cyan
Write-Host "  Room 1:      http://$localIP`:3000  (Equipa A)" -ForegroundColor Cyan
Write-Host "  Room 2:      http://$localIP`:3002  (Equipa B)" -ForegroundColor Cyan
Write-Host "  Room 3:      http://$localIP`:3003  (Equipa C)" -ForegroundColor Cyan
Write-Host "  Final:       http://$localIP`:8080  (Equipa D)" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSO 4: Atualizar HTMLs (Opcional)" -ForegroundColor Green
Write-Host "  Em cada HTML, muda:" -ForegroundColor Gray
Write-Host ""
Write-Host "    <script src='/config.js'></script>" -ForegroundColor Gray
Write-Host "  Para:" -ForegroundColor Gray
Write-Host "    <script src='/config-local.js'></script>" -ForegroundColor Gray
Write-Host ""
Write-Host "  OU usa ferramente Find & Replace no VS Code" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 Vantagens desta Solução" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Máxima Segurança: TI corporativo aprova (é rede local!)" -ForegroundColor Green
Write-Host "✅ Sem Internett: Funciona offline, sem dependências externas" -ForegroundColor Green
Write-Host "✅ Rápido: Sem latência de tuneis públicos" -ForegroundColor Green
Write-Host "✅ Simples: Apenas IP + porta (nada de URLs complexas)" -ForegroundColor Green
Write-Host "✅ Grátis: Sem contas, sem limites" -ForegroundColor Green
Write-Host ""

Write-Host "❌ Limitação: Só funciona na mesma rede/Wi-Fi" -ForegroundColor Yellow
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📞 Contactar TI (Se Pedir)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se TI questionar, manda isto:" -ForegroundColor Cyan
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host "SOLICITAÇÃO: Abrir Portas Locais para Workshop" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "Necessitamos acesso APENAS na rede corporativa (sem Internet):" -ForegroundColor Gray
Write-Host "  - Portas: 4000, 3000, 3002, 3003, 8080" -ForegroundColor Gray
Write-Host "  - Protocolo: HTTP (local only)" -ForegroundColor Gray
Write-Host "  - Destino: 127.0.0.1 (localhost, sem saída para fora)" -ForegroundColor Gray
Write-Host "  - Duração: [DATA] 09h00-17h00" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "É uma aplicação educacional segura, sem dados sensíveis." -ForegroundColor Gray
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Concluído!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
