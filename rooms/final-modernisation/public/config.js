// Visual Escape Room - Configuration with auto-detection

const HOSTNAME = location.hostname;
const IDX_MATCH = HOSTNAME.match(/^(\d+)-(.+)$/);
const IDX_BASE = IDX_MATCH ? IDX_MATCH[2] : null;
const isLocal = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1';
const isIdx = Boolean(IDX_BASE) && HOSTNAME.endsWith('.cloudworkstations.dev');
const isDev = isLocal || isIdx;
const protocol = location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

function hostForPort(port) {
  if (isIdx) return `${port}-${IDX_BASE}`;
  return `${HOSTNAME}:${port}`;
}

window.GAME_CONFIG = {
  GAME_HUB_URL: isDev ? `${protocol}//${hostForPort(4000)}` : 'https://codefestrooms-81695626.web.app',
  ROOM1_URL: isDev ? `${protocol}//${hostForPort(3000)}` : 'https://codefest-room1.web.app',
  ROOM2_URL: isDev ? `${protocol}//${hostForPort(3002)}` : 'https://codefest-room2.web.app',
  ROOM3_URL: isDev ? `${protocol}//${hostForPort(3003)}` : 'https://codefest-room3.web.app',
  FINAL_URL: isDev ? `${protocol}//${hostForPort(8080)}` : 'https://codefest-final.web.app',
  WS_URL: isDev ? `${wsProtocol}//${hostForPort(4000)}` : 'wss://codefestrooms-81695626.web.app',
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
