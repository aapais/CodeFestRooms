/**
 * Visual Escape Room - Configuration
 * Ultra-robust version for Google IDX / Cloud Workstations
 */

const HOSTNAME = location.hostname;
const protocol = location.protocol;

// Deteção IDX / Cloud Workstations
const isIdx = HOSTNAME.includes('.idx.google.com') || HOSTNAME.includes('.cloudworkstations.dev');
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isDev = isIdx || isLocal;

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

    // --- LÓGICA IDX ---
    // No IDX, para evitar erros de CORS e Auth, usamos a mesma origem onde o utilizador está
    // mas trocamos o prefixo da porta se necessário.
    const ports = { gameHub: 4000, room1: 3000, room2: 3002, room3: 3003, final: 8080 };
    const targetPort = ports[target] || 4000;

    if (isIdx) {
      // Substitui o porto no início do hostname (ex: 4000-xxxx -> 3000-xxxx)
      const newHost = HOSTNAME.replace(/^\d+-/, `${targetPort}-`);
      return `${protocol}//${newHost}`;
    }
    
    return `${protocol}//${HOSTNAME}:${targetPort}`;
  },

  getApiUrl: function() {
    // SEGREDO: No IDX, usamos sempre caminhos relativos para a API
    // para garantir que o pedido vai para o mesmo porto/domínio onde o utilizador está logado.
    if (isIdx) return '/api'; 
    
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

window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { 
    return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub').replace('http', 'ws');
  },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
