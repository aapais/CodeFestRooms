const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.GAME_PORT || 3001;

// Serve leaderboard static page
app.use(express.static(path.join(__dirname, 'leaderboard')));
app.use(express.json());

// In-memory game state
const gameState = {
  teams: new Map(), // teamName -> { currentRoom, score, completed: [], lastUpdate }
  rooms: ['room1-archaeology', 'room2-refactor-lab', 'room3-security-vault', 'final-modernisation']
};

// HTTP API for teams to report progress
app.post('/api/team/register', (req, res) => {
  const { teamName } = req.body;
  if (!teamName) return res.status(400).json({ error: 'teamName required' });
  
  if (!gameState.teams.has(teamName)) {
    gameState.teams.set(teamName, {
      currentRoom: 'room1-archaeology',
      score: 0,
      completed: [],
      lastUpdate: Date.now()
    });
  }
  
  res.json({ ok: true, team: gameState.teams.get(teamName) });
  broadcastState();
});

app.post('/api/team/progress', (req, res) => {
  const { teamName, room, action, points } = req.body;
  
  if (!gameState.teams.has(teamName)) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  const team = gameState.teams.get(teamName);
  
  if (action === 'complete') {
    if (!team.completed.includes(room)) {
      team.completed.push(room);
      team.score += points || 100;
    }
  } else if (action === 'navigate') {
    team.currentRoom = room;
  }
  
  team.lastUpdate = Date.now();
  res.json({ ok: true, team });
  broadcastState();
});

app.get('/api/leaderboard', (req, res) => {
  const teams = Array.from(gameState.teams.entries()).map(([name, data]) => ({
    name,
    ...data,
    rank: 0 // Will be calculated
  }));
  
  teams.sort((a, b) => b.score - a.score || a.lastUpdate - b.lastUpdate);
  teams.forEach((team, idx) => team.rank = idx + 1);
  
  res.json({ teams, rooms: gameState.rooms });
});

// WebSocket server for live updates
const server = app.listen(PORT, () => {
  console.log(`🎮 Game Server running at http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('📡 Leaderboard connected');
  
  // Send current state immediately
  ws.send(JSON.stringify({ type: 'state', data: serializeState() }));
  
  ws.on('close', () => console.log('📡 Leaderboard disconnected'));
});

function broadcastState() {
  const state = serializeState();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'state', data: state }));
    }
  });
}

function serializeState() {
  const teams = Array.from(gameState.teams.entries()).map(([name, data]) => ({
    name,
    ...data
  }));
  
  teams.sort((a, b) => b.score - a.score || a.lastUpdate - b.lastUpdate);
  teams.forEach((team, idx) => team.rank = idx + 1);
  
  return { teams, rooms: gameState.rooms };
}
