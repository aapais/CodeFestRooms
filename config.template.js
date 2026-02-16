// =========================================
// CONFIGURAÇÃO DE URLs PARA REDE CORPORATIVA
// =========================================
//
// INSTRUÇÕES:
// 1. Copia este ficheiro para cada pasta public/ das rooms
// 2. Renomeia para config.js
// 3. Substitui os URLs abaixo pelos URLs do ngrok
//
// Exemplo com ngrok:
//   GAME_HUB_URL: 'https://abc123.ngrok-free.app'
//   ROOM1_URL: 'https://def456.ngrok-free.app'
//   etc.

window.GAME_CONFIG = {
  // URL do Game Hub (onde está o leaderboard)
  GAME_HUB_URL: 'http://localhost:4000',
  
  // URLs das Rooms individuais
  ROOM1_URL: 'http://localhost:3000',
  ROOM2_URL: 'http://localhost:3002',
  ROOM3_URL: 'http://localhost:3003',
  FINAL_URL: 'http://localhost:8080',
  
  // WebSocket endpoint (normalmente mesmo que GAME_HUB_URL mas com ws://)
  // Para ngrok HTTPS, usa wss:// em vez de ws://
  WS_URL: 'ws://localhost:4000',
  
  // ID da room atual (será preenchido automaticamente por cada HTML)
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
