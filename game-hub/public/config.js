/**
 * Visual Escape Room - Configuration (SIMPLIFIED)
 */
const HOSTNAME = location.hostname;
const isDev = HOSTNAME.includes('localhost') || HOSTNAME.includes('idx.google.com') || HOSTNAME.includes('cloudworkstations.dev');

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  
  // No IDX, tudo corre na mesma porta agora (Túnel Único)
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
    // MODO SIMPLES: Apenas caminhos na mesma porta
    const paths = { gameHub: '/', room1: '/room1/', room2: '/room2/', room3: '/room3/', final: '/final/' };
    return paths[target] || '/';
  },

  getApiUrl: () => 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api',
  getGlobalApiUrl: () => 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api',

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
      return !!(data.ok && data.timer && data.timer.startTime);
    } catch (e) { return true; }
  },

  logout: () => {
    localStorage.removeItem('teamName');
    localStorage.removeItem('teamToken');
    window.location.href = '/';
  }
};
