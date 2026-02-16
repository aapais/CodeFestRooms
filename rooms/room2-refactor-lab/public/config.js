// Visual Escape Room - Firebase Hosting Configuration

window.GAME_CONFIG = {
  GAME_HUB_URL: 'https://codefestrooms-81695626.web.app',
  ROOM1_URL: 'https://codefest-room1.web.app',
  ROOM2_URL: 'https://codefest-room2.web.app',
  ROOM3_URL: 'https://codefest-room3.web.app',
  FINAL_URL: 'https://codefest-final.web.app',
  WS_URL: 'wss://codefestrooms-81695626.web.app',
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
