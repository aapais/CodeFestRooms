/**
 * Visual Escape Room - Configuration
 * 
 * Deteta automaticamente entre desenvolvimento local/IDX e produção Firebase.
 */

const HOSTNAME = location.hostname;
const IDX_MATCH = HOSTNAME.match(/^(\d+)-(.+)$/);
const IDX_BASE = IDX_MATCH ? IDX_MATCH[2] : null;
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isIdx = Boolean(IDX_BASE) && (HOSTNAME.endsWith('.cloudworkstations.dev') || HOSTNAME.endsWith('.idx.google.com'));
const isDev = isLocal || isIdx;
const protocol = location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

function hostForPort(port) {
  if (isIdx) return `${port}-${IDX_BASE}`;
  return `${HOSTNAME}:${port}`;
}

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  FIREBASE_PROJECT_ID: 'codefestrooms-487913',
  
  // Dev URLs (localhost or Google IDX previews)
  DEV_URLS: {
    gameHub: '/', 
    room1: '/room1/',
    room2: '/room2/',
    room3: '/room3/',
    final: '/final/'
  },
  
  // Production Firebase URLs
  PRODUCTION_URLS: {
    gameHub: 'https://codefestrooms-487913.web.app',
    gameHubAPI: 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api',
    room1: 'https://codefest-room1.web.app',
    room2: 'https://codefest-room2.web.app',
    room3: 'https://codefest-room3.web.app',
    final: 'https://codefest-final.web.app'
  },
  
  getUrl: function(target) {
    const urls = isDev ? this.DEV_URLS : this.PRODUCTION_URLS;
    return urls[target] || urls.gameHub;
  },
  getApiUrl: function() {
    return this.PRODUCTION_URLS.gameHubAPI;
  },
  getWebSocketUrl: function() {
    if (isDev) {
      return `${wsProtocol}//${hostForPort(4000)}`;
    }
    return 'wss://codefestrooms-81695626.web.app';
  },
  
  getRoomUrl: function(roomId) {
    const map = {
      room1: this.getUrl('room1'),
      room2: this.getUrl('room2'),
      room3: this.getUrl('room3'),
      final: this.getUrl('final'),
      hub: this.getUrl('gameHub')
    };
    const baseUrl = map[roomId] || this.getUrl('gameHub');
    
    // Propagate credentials via URL if they exist
    const name = this.getTeamName();
    const token = this.getTeamToken();
    if (name && token) {
      const sep = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${sep}teamName=${encodeURIComponent(name)}&teamToken=${encodeURIComponent(token)}`;
    }
    return baseUrl;
  },
  
  // Team Management Helpers
  getTeamName: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('teamName') || localStorage.getItem('teamName');
    if (name) localStorage.setItem('teamName', name);
    return name;
  },
  setTeamName: (name) => localStorage.setItem('teamName', name),
  getTeamToken: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('teamToken') || localStorage.getItem('teamToken');
    if (token) localStorage.setItem('teamToken', token);
    return token;
  },
  setTeamToken: (token) => localStorage.setItem('teamToken', token),
  logout: () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamToken');
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
