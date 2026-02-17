const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Load validation module (assuming validation.js is accessible from shared)
// In production, this would be properly imported
const ValidationModule = require('../shared/validation.js');
const { RoomTransitionValidator } = ValidationModule;

// In-memory game state
const teams = new Map(); // teamId -> { name, currentRoom, score, completedRooms: [] }
const rooms = ['room1-archaeology', 'room2-refactor-lab', 'room3-security-vault', 'final-modernisation'];
const transitionValidator = new RoomTransitionValidator(); // Global transition validator instance

// Broadcast to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// REST API: Register/login team
app.post('/api/team/login', (req, res) => {
  const { teamName } = req.body;
  if (!teamName || teamName.trim() === '') {
    return res.status(400).json({ error: 'Team name is required' });
  }

  const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
  
  if (!teams.has(teamId)) {
    teams.set(teamId, {
      name: teamName,
      currentRoom: 'room1-archaeology',
      score: 0,
      completedRooms: [],
      timestamp: Date.now()
    });
  }

  broadcast({ type: 'team-update', teams: getLeaderboard() });
  
  res.json({ 
    ok: true, 
    teamId,
    team: teams.get(teamId)
  });
});

// REST API: Update team progress
app.post('/api/team/progress', (req, res) => {
  const { teamId, room, score, completed, validationResult } = req.body;
  
  if (!teams.has(teamId)) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const team = teams.get(teamId);
  
  if (completed && !team.completedRooms.includes(room)) {
    // Validate room completion using transition validator
    const completionStatus = transitionValidator.markRoomCompleted(teamId, room, validationResult || {
      valid: true,
      status: 'success'
    });

    if (completionStatus.success) {
      team.completedRooms.push(room);
      team.score += score || (validationResult?.metadata?.points || 0);
      
      broadcast({ 
        type: 'team-update', 
        teams: getLeaderboard(),
        roomCompleted: room,
        teamId: teamId
      });

      return res.json({ 
        ok: true, 
        team,
        sessionMessage: completionStatus.message,
        nextRoomHint: completionStatus.nextRoomHint
      });
    } else {
      return res.status(400).json({ 
        error: 'Room completion validation failed',
        errors: completionStatus.errors
      });
    }
  }

  res.json({ ok: true, team });
});

// REST API: Navigate to next room (with validation)
app.post('/api/team/navigate', (req, res) => {
  const { teamId, targetRoom } = req.body;
  
  if (!teams.has(teamId)) {
    return res.status(404).json({ error: 'Team not found' });
  }

  // Validate if team can progress to target room
  const progressCheck = transitionValidator.canProgressToRoom(teamId, targetRoom);
  
  if (!progressCheck.canProgress) {
    return res.status(403).json({ 
      error: 'Cannot progress to this room',
      ...progressCheck
    });
  }

  const team = teams.get(teamId);
  team.currentRoom = targetRoom;

  broadcast({ 
    type: 'team-update', 
    teams: getLeaderboard(),
    navigationEvent: {
      teamId: teamId,
      movedTo: targetRoom,
      message: progressCheck.message
    }
  });
  
  res.json({ 
    ok: true, 
    team,
    message: progressCheck.message,
    nextRoomHint: transitionValidator.getNextRoomHint(teamId, targetRoom)
  });
});

// REST API: Get team progress
app.get('/api/team/:teamId/progress', (req, res) => {
  const { teamId } = req.params;

  if (!teams.has(teamId)) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const team = teams.get(teamId);
  const progress = transitionValidator.getTeamProgress(teamId);
  const isComplete = transitionValidator.isGameComplete(teamId);

  res.json({
    ok: true,
    teamId,
    teamName: team.name,
    score: team.score,
    progress,
    isComplete,
    gameStatus: isComplete ? 'completed' : 'in-progress'
  });
});

// REST API: Get all room objectives
app.get('/api/rooms/objectives', (req, res) => {
  const objectives = transitionValidator.getAllRoomObjectives();
  res.json({
    ok: true,
    objectives,
    totalRooms: objectives.length
  });
});

// REST API: Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json({ teams: getLeaderboard() });
});

function getLeaderboard() {
  return Array.from(teams.values())
    .sort((a, b) => {
      // Sort by: completed rooms desc, then score desc, then timestamp asc
      if (b.completedRooms.length !== a.completedRooms.length) {
        return b.completedRooms.length - a.completedRooms.length;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timestamp - b.timestamp;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1
    }));
}

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send current leaderboard to new client
  ws.send(JSON.stringify({ 
    type: 'team-update', 
    teams: getLeaderboard() 
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
  console.log(`🎮 GameMaster server running at http://localhost:${PORT}`);
});
