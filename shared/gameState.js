// 🎮 Game State Management (Firestore Integration)
// Biblioteca partilhada por todas as rooms e dashboard

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 TEAM STATE STRUCTURE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// teams/{teamId}
// {
//   id: string,
//   name: string,
//   score: number,
//   currentRoom: string | null,
//   completedRooms: string[],
//   status: 'active' | 'completed',
//   lastResult: string,
//   createdAt: Timestamp,
//   updatedAt: Timestamp
// }

// Room points configuration
const ROOM_POINTS = {
  room1: 100,
  room2: 150,
  room3: 150,
  final: 200
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆕 CREATE OR JOIN TEAM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function createTeam(teamName) {
  const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const teamData = {
    id: teamId,
    name: teamName,
    score: 0,
    currentRoom: null,
    completedRooms: [],
    status: 'active',
    lastResult: '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('teams').doc(teamId).set(teamData);
  
  // Save to localStorage
  localStorage.setItem('teamId', teamId);
  localStorage.setItem('teamName', teamName);
  
  return teamId;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 GET CURRENT TEAM (from localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getCurrentTeam() {
  const teamId = localStorage.getItem('teamId');
  const teamName = localStorage.getItem('teamName');
  
  if (!teamId || !teamName) {
    return null;
  }
  
  return { teamId, teamName };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 ENTER A ROOM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function enterRoom(teamId, roomId) {
  await db.collection('teams').doc(teamId).update({
    currentRoom: roomId,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ COMPLETE A ROOM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function completeRoom(teamId, roomId, customMessage = null) {
  const points = ROOM_POINTS[roomId] || 0;
  const message = customMessage || `${roomId} completed! +${points} points`;
  
  await db.collection('teams').doc(teamId).update({
    score: firebase.firestore.FieldValue.increment(points),
    completedRooms: firebase.firestore.FieldValue.arrayUnion(roomId),
    currentRoom: null,
    lastResult: message,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  return points;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 GET TEAM DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getTeamData(teamId) {
  const doc = await db.collection('teams').doc(teamId).get();
  
  if (!doc.exists) {
    throw new Error('Team not found');
  }
  
  return doc.data();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏆 GET LEADERBOARD (real-time listener)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function listenToLeaderboard(callback) {
  return db.collection('teams')
    .orderBy('score', 'desc')
    .orderBy('updatedAt', 'asc') // Tie-breaker: quem completou primeiro
    .onSnapshot(snapshot => {
      const teams = [];
      snapshot.forEach(doc => {
        teams.push(doc.data());
      });
      callback(teams);
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CHECK IF ROOM IS COMPLETED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function isRoomCompleted(teamId, roomId) {
  const teamData = await getTeamData(teamId);
  return teamData.completedRooms.includes(roomId);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ LOGOUT (clear localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function logoutTeam() {
  localStorage.removeItem('teamId');
  localStorage.removeItem('teamName');
  window.location.href = '/';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT ALL FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.GameState = {
  createTeam,
  getCurrentTeam,
  enterRoom,
  completeRoom,
  getTeamData,
  listenToLeaderboard,
  isRoomCompleted,
  logoutTeam,
  ROOM_POINTS
};
