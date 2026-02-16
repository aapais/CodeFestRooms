/**
 * Visual Escape Room - Firebase Hosting Configuration
 */

window.ESCAPE_ROOM_CONFIG = {
  MODE: 'production',
  PRODUCTION_URLS: {
    gameHub: 'https://codefestrooms-81695626.web.app',
    room1: 'https://codefest-room1.web.app',
    room2: 'https://codefest-room2.web.app',
    room3: 'https://codefest-room3.web.app',
    final: 'https://codefest-final.web.app'
  },
  getUrl: function(target) {
    return this.PRODUCTION_URLS[target] || this.PRODUCTION_URLS.gameHub;
  }
};
