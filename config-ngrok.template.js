# =========================================
# CONFIG PARA NGROK (REDE CORPORATIVA)
# =========================================
#
# INSTRUÇÕES:
# 1. Edita os URLs abaixo com os teus URLs de ngrok
# 2. Após setup_ngrok.ps1 gerar os URLs, copia aqui
# 3. Todos os HTMLs carregam este ficheiro automaticamente
#
# Exemplo:
#   GAME_HUB_URL: 'https://abc123.ngrok-free.app'
#   ROOM1_URL: 'https://def456.ngrok-free.app'
#   etc.

window.GAME_CONFIG = {
  // ===== SUBSTITUI ESTES URLs COM OS TEUS =====
  
  // URL do Game Hub (leaderboard central)
  GAME_HUB_URL: 'https://abc123.ngrok-free.app',
  
  // URLs das Rooms individuais
  ROOM1_URL: 'https://def456.ngrok-free.app',
  ROOM2_URL: 'https://ghi789.ngrok-free.app',
  ROOM3_URL: 'https://jkl012.ngrok-free.app',
  FINAL_URL: 'https://mno345.ngrok-free.app',
  
  // WebSocket endpoint
  // Para ngrok HTTPS: usa wss:// (secure websocket)
  WS_URL: 'wss://abc123.ngrok-free.app',
  
  // ID da room atual (preenchido automaticamente)
  CURRENT_ROOM: null,
  
  // Mapeamento de room IDs para URLs
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
