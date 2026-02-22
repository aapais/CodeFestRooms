/**
 * Visual Escape Room - Configuration
 * Distributed Architecture for Google IDX
 */

const HOSTNAME = location.hostname;
const protocol = location.protocol;

// Deteção IDX
const isIdx = HOSTNAME.includes('.idx.google.com') || HOSTNAME.includes('.cloudworkstations.dev');
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isDev = isIdx || isLocal;

// Extrair base do workspace para gerar URLs de portas diferentes
let idxBase = null;
if (isIdx) {
  const parts = HOSTNAME.split('.');
  const firstPart = parts[0];
  const dashIndex = firstPart.indexOf('-');
  if (dashIndex !== -1) {
    idxBase = firstPart.substring(dashIndex + 1) + '.' + parts.slice(1).join('.');
  }
}

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  FIREBASE_PROJECT_ID: 'codefestrooms-487913',
  
  getUrl: function(target) {
    if (!isDev) {
      const prod = {
        gameHub: 'https://codefestrooms-487913.web.app',
        room1: 'https://codefest-room1.web.app',
        room2: 'https://codefest-room2.web.app',
        room3: 'https://codefest-room3.web.app',
        final: 'https://codefest-final.web.app'
      };
      return prod[target] || prod.gameHub;
    }

    // No IDX, cada sala tem a sua própria URL oficial do Google
    const ports = { gameHub: 4000, room1: 3000, room2: 3002, room3: 3003, final: 8080 };
    const targetPort = ports[target] || 4000;

    if (isIdx && idxBase) {
      return `${protocol}//${targetPort}-${idxBase}`;
    }
    return `${protocol}//${HOSTNAME}:${targetPort}`;
  },

  getApiUrl: function() {
    // SEGREDO: No IDX, fazemos chamadas relativas à PORTA ATUAL.
    // Cada servidor de sala (3000, 3002...) tem um proxy interno para o Hub (4000).
    if (isDev) return '/api';
    return 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';
  },

  getRoomUrl: function(roomId) {
    const url = this.getUrl(roomId);
    const name = this.getTeamName();
    const token = this.getTeamToken();
    if (name && token && isDev) {
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
    window.location.href = window.ESCAPE_ROOM_CONFIG.getUrl('gameHub');
  }
};

window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub').replace('http', 'ws'); },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
