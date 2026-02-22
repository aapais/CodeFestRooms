/**
 * Visual Escape Room - Configuration
 * Direct-to-Cloud Architecture
 */

const HOSTNAME = location.hostname;
const protocol = location.protocol;

const isIdx = HOSTNAME.includes('.idx.google.com') || HOSTNAME.includes('.cloudworkstations.dev');
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isDev = isIdx || isLocal;

// FONTE DA VERDADE ÚNICA
const CLOUD_API = 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';

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

    const ports = { gameHub: 4000, room1: 3000, room2: 3002, room3: 3003, final: 8080 };
    const targetPort = ports[target] || 4000;

    if (isIdx) {
      const parts = HOSTNAME.split('.');
      const firstPart = parts[0];
      const dashIndex = firstPart.indexOf('-');
      if (dashIndex !== -1) {
        const idxBase = firstPart.substring(dashIndex + 1) + '.' + parts.slice(1).join('.');
        return `${protocol}//${targetPort}-${idxBase}`;
      }
    }
    return `${protocol}//${HOSTNAME}:${targetPort}`;
  },

  getApiUrl: function() {
    // SEMPRE CLOUD: Evita erros de proxy local no IDX
    return CLOUD_API;
  },

  getGlobalApiUrl: function() {
    return CLOUD_API;
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
  
  checkGameStart: async function() {
    try {
      const res = await fetch(this.getGlobalApiUrl() + '/timer');
      const data = await res.json();
      if (data.ok && data.timer && data.timer.startTime) return true;
      this.showLockOverlay();
      return false;
    } catch (e) {
      return true; // Failsafe
    }
  },

  showLockOverlay: function() {
    if (document.getElementById('hq-lock-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'hq-lock-overlay';
    overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#05070a;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f85149;font-family:monospace;text-align:center;padding:20px;';
    overlay.innerHTML = `<h1>⚠️ ACCESS DENIED</h1><p>MISSION NOT STARTED BY HQ</p>`;
    document.body.appendChild(overlay);
    setTimeout(() => window.location.reload(), 5000);
  },

  logout: () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamToken');
    window.location.href = window.ESCAPE_ROOM_CONFIG.getUrl('gameHub');
  }
};

window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { return location.origin.replace('http', 'ws'); },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
