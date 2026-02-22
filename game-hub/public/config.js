/**
 * Visual Escape Room - Configuration
 * Single-Port Architecture for Google IDX
 */

const HOSTNAME = location.hostname;
const protocol = location.protocol;

// Deteção IDX
const isIdx = HOSTNAME.includes('.idx.google.com') || HOSTNAME.includes('.cloudworkstations.dev');
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isDev = isIdx || isLocal;

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

    // No IDX, usamos sempre o mesmo host e mudamos apenas o caminho
    const paths = { gameHub: '/', room1: '/room1/', room2: '/room2/', room3: '/room3/', final: '/final/' };
    return paths[target] || '/';
  },

  getApiUrl: function() {
    // API é sempre relativa ao Hub
    return isDev ? '/api' : 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';
  },

  getRoomUrl: function(roomId) {
    const baseUrl = this.getUrl(roomId);
    const name = this.getTeamName();
    const token = this.getTeamToken();
    if (name && token && isDev) {
      const sep = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${sep}teamName=${encodeURIComponent(name)}&teamToken=${encodeURIComponent(token)}`;
    }
    return baseUrl;
  },

  getTeamName: () => localStorage.getItem('teamName') || new URLSearchParams(window.location.search).get('teamName'),
  setTeamName: (name) => localStorage.setItem('teamName', name),
  getTeamToken: () => localStorage.getItem('teamToken') || new URLSearchParams(window.location.search).get('teamToken'),
  setTeamToken: (token) => localStorage.setItem('teamToken', token),
  logout: () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamToken');
    window.location.href = '/';
  }
};

window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { return location.origin.replace('http', 'ws'); },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
