// Visual Escape Room - Configuration with auto-detection

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

window.GAME_CONFIG = {
  GAME_HUB_URL: isLocal ? `${location.protocol}//${location.hostname}:4000` : 'https://codefestrooms-81695626.web.app',
  ROOM1_URL: isLocal ? `${location.protocol}//${location.hostname}:3000` : 'https://codefest-room1.web.app',
  ROOM2_URL: isLocal ? `${location.protocol}//${location.hostname}:3002` : 'https://codefest-room2.web.app',
  ROOM3_URL: isLocal ? `${location.protocol}//${location.hostname}:3003` : 'https://codefest-room3.web.app',
  FINAL_URL: isLocal ? `${location.protocol}//${location.hostname}:8080` : 'https://codefest-final.web.app',
  WS_URL: isLocal ? `ws://${location.hostname}:4000` : 'wss://codefestrooms-81695626.web.app',
  CURRENT_ROOM: null,
  getRoomUrl: function(roomId) {
    const map = {
      room1: this.ROOM1_URL,
      room2: this.ROOM2_URL,
      room3: this.ROOM3_URL,
      final: this.FINAL_URL,
      hub: this.GAME_HUB_URL
    };
    return map[roomId] || this.ROOM1_URL;
  }
};
