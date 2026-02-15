# 🎮 Visual Escape Room - Game System Guide

## 🏗 Architecture

```
Game Hub (port 4000)
├─ Express server managing team state
├─ WebSocket broadcasts for live updates
├─ Endpoints: /api/team/login, /api/team/update, /api/state
└─ Leaderboard UI with badges + scoring

Room 1: Legacy Shop (port 3000)
├─ Challenge: Find IVA tax bug in checkout
├─ Mark Complete: 100 points

Room 2: Invoice Engine (port 3002)
├─ Challenge: Reduce code complexity ≤ 10
├─ Validate: ESLint check
├─ Mark Complete: 150 points

Room 3: Security Vault (port 3003)
├─ Challenge: SQL injection vulnerability login
├─ Mark Complete: 150 points

Final Room: Monolith (port 8080)
├─ Challenge: API stability + credit scoring
├─ Mark Complete: 200 points
```

## 🎯 Team Flow

1. **Join**: Team enters name → POST `/api/team/login`
2. **Explore**: Navigate rooms via "Prev Room" / "Next Room" buttons
3. **Complete**: Mark room complete → `completedRoom` flag sent to hub
4. **Score**: Hub auto-calculates points (ROOM_POINTS config)
5. **Track**: Badges auto-update every 3s (🏚 ✅ 🧱 ✅ 🔐 ✅ 🏢 ❌)
6. **Compete**: Leaderboard shows live rankings

## 📊 Scoring System

| Room | Points | Trigger |
|------|--------|---------|
| Room 1 | 100 | Mark Complete or auto-detect |
| Room 2 | 150 | Complexity check passes + Mark Complete |
| Room 3 | 150 | SQL injection solved + Mark Complete |
| Final | 200 | Monolith challenges + Mark Complete |

**Total Possible: 600 points**

## 🔄 Real-time Updates

- **Frontend**: Each room calls `fetchTeamState()` every 3s
- **Backend**: Hub broadcasts state via WebSocket to leaderboard
- **Badges**: Auto-update when room is marked complete
- **Score**: Immediately reflected in leaderboard

## 🌐 Cross-Room Navigation

```javascript
// Available in all rooms
- goPrevRoom()   // Navigate to previous room
- goNextRoom()   // Navigate to next room
- goToRoom(id)   // Jump to specific room
- updateTeam()   // Send progress to hub
```

## 📱 UI Elements

### Team Bar (all rooms)
```
[Team Name] [Join] [Badges: 🏚🧱🔐🏢] [Leaderboard] [Prev] [Next] [Mark Complete]
```

### Badges
- 🟢 Green = Room completed
- 🔘 Gray = Not completed
- Auto-sync from hub state

### Leaderboard
- Live table sorted by score (descending)
- Shows: Rank, Team, Current Room, Status, Score, Completed Badges, Last Result

## 🧪 Testing

### Quick Test
```bash
# Terminal 1: Start hub
cd game-hub && npm start

# Terminal 2: Start room 1
cd rooms/room1-archaeology && npm start

# Terminal 3: Start room 2
cd rooms/room2-refactor-lab && npm start

# Terminal 4: Start room 3
cd rooms/room3-security-vault && npm start

# Terminal 5: Start final room
cd rooms/final-modernisation && npm start
```

### Browser Test
1. Go to `http://localhost:3000` (Room 1)
2. Enter team name "TestTeam"
3. Click "Join"
4. Verify badges appear (all gray initially)
5. Click "Mark Complete"
6. Verify Room 1 badge turns green + points awarded
7. Click "Next Room" → should navigate to Room 2
8. Open leaderboard in another tab: `http://localhost:4000`
9. Verify TestTeam appears with score

## 🐛 Troubleshooting

### Badges not updating
- Check that game hub is running on port 4000
- Verify network requests in DevTools (should see GET `/api/state` calls)
- Try F5 refresh

### Points not awarded
- Ensure `completedRoom` is sent in hub update
- Check server console: `game-hub/server.js` for upsertTeam logs
- Verify ROOM_POINTS config in server

### Room navigation broken
- Verify port mappings match: 3000/3002/3003/8080
- Check browser console for fetch errors
- Ensure all servers are running

## 📊 Example: Team "Alpha" Progression

```
Time 0:00  → Join Room 1
Time 1:30  → Mark Complete Room 1  (100 pts) 🏚✅
Time 2:00  → Navigate to Room 2
Time 5:45  → Complexity check passes → Mark Complete (150 pts) 🧱✅
Time 6:00  → Navigate to Room 3
Time 8:20  → SQL injection solved → Mark Complete (150 pts) 🔐✅
Time 8:30  → Navigate to Final
Time 11:00 → Monolith tests pass → Mark Complete (200 pts) 🏢✅
────────────────────────────────────────
Final Score: 600 pts, All badges complete ✅
```

## 🔧 Environment Variables

### Game Hub (game-hub/server.js)
```
HUB_PORT=4000
```

### Room Servers
```
PORT=3000     # Room 1
PORT=3002     # Room 2
PORT=3003     # Room 3
PORT=8080     # Final
```

## 📝 API Reference

### POST /api/team/login
```json
{
  "name": "Team Alpha"
}
```
Response: `{ ok: true, team: {...} }`

### POST /api/team/update
```json
{
  "name": "Team Alpha",
  "room": "room1",
  "status": "in-progress",
  "result": "Logged in",
  "completedRoom": "room1",
  "scoreDelta": 0
}
```
Response: `{ ok: true, team: {...} }`

### GET /api/state
```json
{
  "ok": true,
  "teams": [
    {
      "id": "Team Alpha",
      "name": "Team Alpha",
      "room": "room1",
      "score": 100,
      "completedRooms": ["room1"],
      "status": "in-progress",
      "lastResult": "Completed room 1",
      "updatedAt": 1699000000000
    }
  ]
}
```

## 🎊 Success Criteria

✅ Team can join any room
✅ Badge system tracks completed rooms
✅ Scores auto-calculate based on completion
✅ Leaderboard updates in real-time
✅ Cross-room navigation works seamlessly
✅ All 4 rooms integrated and accessible
✅ WebSocket broadcasts to all connected clients

---

**Last Updated**: 2024
**Commit**: 4f8ed06 (badges + scoring system)
