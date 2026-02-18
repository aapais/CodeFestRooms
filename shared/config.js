/**
 * Visual Escape Room - Firebase Hosting Configuration
 * 
 * Configuracao unica para producao em Firebase Hosting.
 */

window.ESCAPE_ROOM_CONFIG = {
  MODE: 'production',
  FIREBASE_PROJECT_ID: 'codefestrooms-81695626',
  PRODUCTION_URLS: {
    gameHub: 'https://codefestrooms-81695626.web.app',
    gameHubAPI: 'https://us-central1-codefestrooms-81695626.cloudfunctions.net/api',
    room1: 'https://codefest-room1.web.app',
    room2: 'https://codefest-room2.web.app',
    room3: 'https://codefest-room3.web.app',
    final: 'https://codefest-final.web.app'
  },
  getUrl: function(target) {
    return this.PRODUCTION_URLS[target] || this.PRODUCTION_URLS.gameHub;
  },
  getApiUrl: function() {
    return this.PRODUCTION_URLS.gameHubAPI;
  },
  getWebSocketUrl: function() {
    const hubUrl = this.getUrl('gameHub');
    return hubUrl.replace('https://', 'wss://');
  },
  getRoomUrl: function(roomId) {
    const map = {
      room1: this.getUrl('room1'),
      room2: this.getUrl('room2'),
      room3: this.getUrl('room3'),
      final: this.getUrl('final'),
      hub: this.getUrl('gameHub')
    };
    return map[roomId] || this.getUrl('gameHub');
  }
};

// Aliases para compatibilidade com código legado
window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get ROOM1_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('room1'); },
  get ROOM2_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('room2'); },
  get ROOM3_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('room3'); },
  get FINAL_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('final'); },
  get WS_URL() { return window.ESCAPE_ROOM_CONFIG.getWebSocketUrl(); },
  getRoomUrl: function(roomId) { return window.ESCAPE_ROOM_CONFIG.getRoomUrl(roomId); }
};

console.log('🔧 Escape Room Config Loaded:', {
  mode: window.ESCAPE_ROOM_CONFIG.MODE,
  gameHub: window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'),
  websocket: window.ESCAPE_ROOM_CONFIG.getWebSocketUrl()
});
