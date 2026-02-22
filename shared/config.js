/**
 * Visual Escape Room - Configuration (ULTRA-SIMPLIFIED)
 * No more port guessing, no more hostname manipulation.
 */
const isDev = location.hostname.includes('localhost') || location.hostname.includes('idx.google.com') || location.hostname.includes('cloudworkstations.dev');

window.ESCAPE_ROOM_CONFIG = {
  MODE: isDev ? 'development' : 'production',
  
  // No IDX, usamos apenas caminhos relativos na mesma origem
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
    // MODO IDX: Fica sempre no mesmo link, muda apenas a pasta
    const paths = { gameHub: '/', room1: '/room1/', room2: '/room2/', room3: '/room3/', final: '/final/' };
    return paths[target] || '/';
  },

  // A API aponta sempre para a Cloud para o progresso global
  getApiUrl: () => 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api',
  getGlobalApiUrl: () => 'https://us-central1-codefestrooms-487913.cloudfunctions.net/api',

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
  setTeamToken: (token) => localStorage.setItem('token', token),
  
  // Bloqueio simplificado sem auto-refresh para evitar crashes
  checkGameStart: async function() {
    try {
      const res = await fetch(this.getGlobalApiUrl() + '/timer');
      const data = await res.json();
      return !!(data.ok && data.timer && data.timer.startTime);
    } catch (e) { return true; }
  },

  logout: () => {
    localStorage.clear();
    window.location.href = '/';
  }
};
