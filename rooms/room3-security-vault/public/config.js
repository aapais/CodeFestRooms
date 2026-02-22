/**
 * Visual Escape Room - Configuration
 * Robust IDX detection and URL mapping
 */

const HOSTNAME = location.hostname;
const protocol = location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

// Deteção IDX
const isIdx = HOSTNAME.includes('.idx.google.com') || HOSTNAME.includes('.cloudworkstations.dev');
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isDev = isIdx || isLocal;

// Extrair base do workspace (ex: 4000-xxxx.idx.google.com -> xxxx.idx.google.com)
let idxBase = null;
if (isIdx) {
  const parts = HOSTNAME.split('.');
  const firstPart = parts[0]; // 4000-xxxxx
  const dashIndex = firstPart.indexOf('-');
  if (dashIndex !== -1) {
    idxBase = firstPart.substring(dashIndex + 1) + '.' + parts.slice(1).join('.');
  } else {
    idxBase = HOSTNAME; // Fallback
  }
}

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  FIREBASE_PROJECT_ID: 'codefestrooms-487913',
  
  getUrl: function(target) {
    if (!isDev) {
      const prodUrls = {
        gameHub: 'https://codefestrooms-487913.web.app',
        room1: 'https://codefest-room1.web.app',
        room2: 'https://codefest-room2.web.app',
        room3: 'https://codefest-room3.web.app',
        final: 'https://codefest-final.web.app'
      };
      return prodUrls[target] || prodUrls.gameHub;
    }

    // Ambiente IDX / Local
    const ports = { gameHub: 4000, room1: 3000, room2: 3002, room3: 3003, final: 8080 };
    const port = ports[target] || 4000;

    if (isIdx && idxBase) {
      return `${protocol}//${port}-${idxBase}`;
    }
    return `${protocol}//${HOSTNAME}:${port}`;
  },

  getApiUrl: function() {
    if (!isDev) return 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';
    return this.getUrl('gameHub') + '/api';
  },

  getRoomUrl: function(roomId) {
    const url = this.getUrl(roomId);
    const name = this.getTeamName();
    const token = this.getTeamToken();
    if (name && token) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}teamName=${encodeURIComponent(name)}&teamToken=${encodeURIComponent(token)}`;
    }
    return url;
  },

  getTeamName: () => localStorage.getItem('teamName') || new URLSearchParams(window.location.search).get('teamName'),
  setTeamName: (name) => localStorage.setItem('teamName', name),
  getTeamToken: () => localStorage.getItem('teamToken') || new URLSearchParams(window.location.search).get('teamToken'),
  setTeamToken: (token) => localStorage.setItem('teamToken', token),
  logout: () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamToken');
  }
};

// Aliases
window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { 
    const url = window.ESCAPE_ROOM_CONFIG.getUrl('gameHub');
    return url.replace('http', 'ws');
  },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
