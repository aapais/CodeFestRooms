/**
 * Visual Escape Room - Configuration
 * Global Sync & Auto-Flow Version
 */
const isDev = location.hostname.includes('localhost') || location.hostname.includes('idx.google.com') || location.hostname.includes('cloudworkstations.dev');
const CLOUD_API = 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api';

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  
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
    const paths = { gameHub: '/', room1: '/room1/', room2: '/room2/', room3: '/room3/', final: '/final/' };
    return paths[target] || '/';
  },

  getApiUrl: () => CLOUD_API,
  getGlobalApiUrl: () => CLOUD_API,

  // Sincroniza o relógio da sala com o Dashboard
  syncClock: async function() {
    try {
      const res = await fetch(this.getGlobalApiUrl() + '/timer');
      const data = await res.json();
      if (data.ok && data.timer && data.timer.startTime) {
        window.GAME_TIMING.startTimer(data.timer.startTime);
        return true;
      }
    } catch (e) { return false; }
    return false;
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
    const started = await this.syncClock();
    if (!started) this.showLockOverlay();
    return started;
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
    localStorage.clear();
    window.location.href = '/';
  }
};

window.GAME_CONFIG = {
  get GAME_HUB_URL() { return window.ESCAPE_ROOM_CONFIG.getUrl('gameHub'); },
  get WS_URL() { return location.origin.replace('http', 'ws'); },
  getRoomUrl: (id) => window.ESCAPE_ROOM_CONFIG.getRoomUrl(id)
};
