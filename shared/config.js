/**
 * Visual Escape Room - Configuration
 * 
 * Deteta automaticamente entre desenvolvimento local e produção Firebase.
 */

// Detect if running locally
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

window.ESCAPE_ROOM_CONFIG = {
  MODE: isLocal ? 'development' : 'production',
  FIREBASE_PROJECT_ID: 'codefestrooms-81695626',
  
  // Local development URLs
  LOCAL_URLS: {
    gameHub: `${location.protocol}//${location.hostname}:4000`,
    room1: `${location.protocol}//${location.hostname}:3000`,
    room2: `${location.protocol}//${location.hostname}:3002`,
    room3: `${location.protocol}//${location.hostname}:3003`,
    final: `${location.protocol}//${location.hostname}:8080`
  },
  
  // Production Firebase URLs
  PRODUCTION_URLS: {
    gameHub: 'https://codefestrooms-81695626.web.app',
    room1: 'https://codefest-room1.web.app',
    room2: 'https://codefest-room2.web.app',
    room3: 'https://codefest-room3.web.app',
    final: 'https://codefest-final.web.app'
  },
  
  getUrl: function(target) {
    const urls = isLocal ? this.LOCAL_URLS : this.PRODUCTION_URLS;
    return urls[target] || urls.gameHub;
  },
  
  getWebSocketUrl: function() {
    const hubUrl = this.getUrl('gameHub');
    if (isLocal) {
      return hubUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    }
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
