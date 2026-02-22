/**
 * Firebase Functions for Visual Escape Room
 * Servidor central para todas as equipas
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
const router = express.Router();

const ROOM_ORDER = ['room1', 'room2', 'room3', 'final'];
const ROOM_POINTS = {
  room1: 100,
  room2: 150,
  room3: 150,
  final: 200
};

// Room Transition Validator
const ROOM_OBJECTIVES = {
  'room1': {
    name: '🏺 Arqueologia de Código',
    objective: 'Encontrar e corrigir o bug no cálculo de IVA',
    description: 'Formula correta: base = (preço - desconto + shipping); imposto = base * 0.23'
  },
  'room2': {
    name: '🔧 Laboratório de Refatorização',
    objective: 'Refatorizar código para seguir boas práticas',
    description: 'Melhorar legibilidade, performance e manutenibilidade'
  },
  'room3': {
    name: '🔒 Cofre de Segurança',
    objective: 'Corrigir vulnerabilidades de segurança',
    description: 'Eliminar XSS, SQL Injection, hardcoded secrets'
  },
  'final': {
    name: '🚀 Modernização Final',
    objective: 'Implementar arquitetura moderna e melhores práticas',
    description: 'Integrar todas as competências em solução completa'
  }
};

function canProgressToRoom(completedRooms, targetRoomId) {
  const targetIndex = ROOM_ORDER.indexOf(targetRoomId);
  
  if (targetIndex === -1) {
    return {
      canProgress: false,
      reason: `❌ Sala ${targetRoomId} não existe`
    };
  }
  
  // First room - always allowed
  if (targetIndex === 0) {
    return {
      canProgress: true,
      message: '✅ Bem-vindo ao escape room!'
    };
  }
  
  // Must complete previous room first
  const previousRoomId = ROOM_ORDER[targetIndex - 1];
  if (!completedRooms.includes(previousRoomId)) {
    const prevRoom = ROOM_OBJECTIVES[previousRoomId];
    return {
      canProgress: false,
      reason: `❌ Primeiro completa a sala anterior: "${prevRoom.name}"`,
      blockedBy: previousRoomId
    };
  }
  
  return {
    canProgress: true,
    message: `✅ Bem-vindo a ${ROOM_OBJECTIVES[targetRoomId].name}!`
  };
}

function normalizeTeamName(name) {
  const safe = String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 32);
  return safe || 'Team';
}

/**
 * GET /api/state
 * Retorna estado de todas as equipas
 */
router.get('/state', async (req, res) => {
  try {
    const snapshot = await db.collection('teams').get();
    const teams = [];
    
    snapshot.forEach(doc => {
      teams.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by score descending
    teams.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.updatedAt || 0) - (b.updatedAt || 0);
    });
    
    res.json({ ok: true, teams });
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/team/login
 * Criar ou fazer login de uma equipa
 */
router.post('/team/login', async (req, res) => {
  try {
    const name = normalizeTeamName(req.body && req.body.name);
    const teamRef = db.collection('teams').doc(name);
    const teamDoc = await teamRef.get();
    
    let team;
    if (teamDoc.exists) {
      team = { id: name, ...teamDoc.data() };
    } else {
      team = {
        id: name,
        name: name,
        room: 'room1',
        score: 0,
        completedRooms: [],
        status: 'in-progress',
        lastResult: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await teamRef.set(team);
    }
    
    // Update last seen
    await teamRef.update({ 
      status: 'in-progress',
      updatedAt: Date.now() 
    });
    
    res.json({ ok: true, team });
  } catch (error) {
    console.error('Error in team login:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/team/update
 * Atualizar estado da equipa (room, score, completed)
 */
router.post('/team/update', async (req, res) => {
  try {
    const body = req.body || {};
    const name = normalizeTeamName(body.name);
    const teamRef = db.collection('teams').doc(name);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ ok: false, error: 'Team not found' });
    }
    
    const existing = teamDoc.data();
    const completedRoom = body.completedRoom || (body.status === 'completed' ? body.room : undefined);
    const completedRooms = Array.isArray(existing.completedRooms)
      ? [...existing.completedRooms]
      : [];
    
    let scoreDelta = Number(body.scoreDelta || 0);
    
    // Auto-add points for completing a room
    if (completedRoom && !completedRooms.includes(completedRoom)) {
      completedRooms.push(completedRoom);
      scoreDelta += ROOM_POINTS[completedRoom] || 0;
    }
    
    const updates = {
      updatedAt: Date.now()
    };
    
    if (body.room) updates.room = body.room;
    if (body.status) updates.status = body.status;
    if (body.result !== undefined) updates.lastResult = body.result;
    if (completedRooms.length > 0) updates.completedRooms = completedRooms;
    if (scoreDelta !== 0) {
      updates.score = Math.max(0, (existing.score || 0) + scoreDelta);
    }
    
    await teamRef.update(updates);
    
    const updated = await teamRef.get();
    const team = { id: name, ...updated.data() };
    
    res.json({ ok: true, team });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/team/complete-room
 * Marcar room como completa
 */
router.post('/team/complete-room', async (req, res) => {
  try {
    const body = req.body || {};
    const name = normalizeTeamName(body.name);
    const roomId = body.roomId;
    
    if (!roomId) {
      return res.status(400).json({ ok: false, error: 'Missing roomId' });
    }
    
    const teamRef = db.collection('teams').doc(name);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ ok: false, error: 'Team not found' });
    }
    
    const existing = teamDoc.data();
    const completedRooms = Array.isArray(existing.completedRooms)
      ? [...existing.completedRooms]
      : [];
    
    // Don't add duplicates
    if (completedRooms.includes(roomId)) {
      return res.json({ 
        ok: true, 
        message: 'Room already completed',
        team: { id: name, ...existing }
      });
    }
    
    completedRooms.push(roomId);
    const points = ROOM_POINTS[roomId] || 0;
    const newScore = (existing.score || 0) + points;
    
    await teamRef.update({
      completedRooms,
      score: newScore,
      lastResult: `Completed ${roomId} (+${points} pts)`,
      updatedAt: Date.now()
    });
    
    const updated = await teamRef.get();
    const team = { id: name, ...updated.data() };
    
    res.json({ 
      ok: true, 
      message: `Room ${roomId} completed! +${points} points`,
      team 
    });
  } catch (error) {
    console.error('Error completing room:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/kickoff
 * Inicia o timer do jogo
 */
router.post('/kickoff', async (req, res) => {
  try {
    const startTime = Date.now();
    await db.collection('gameState').doc('timer').set({
      startTime,
      duration: 50 * 60 * 1000, // 50 minutes in ms
      updatedAt: startTime
    });
    
    res.json({ ok: true, startTime });
  } catch (error) {
    console.error('Error in kickoff:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/timer
 * Obter estado do timer
 */
router.get('/timer', async (req, res) => {
  try {
    const timerDoc = await db.collection('gameState').doc('timer').get();
    
    if (!timerDoc.exists) {
      return res.json({ ok: true, timer: null });
    }
    
    const timer = timerDoc.data();
    res.json({ ok: true, timer });
  } catch (error) {
    console.error('Error getting timer:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/team/check-access
 * Verificar se equipa pode aceder a uma room
 */
router.post('/team/check-access', async (req, res) => {
  try {
    const body = req.body || {};
    const name = normalizeTeamName(body.name);
    const targetRoom = body.roomId;
    
    if (!targetRoom) {
      return res.status(400).json({ ok: false, error: 'Missing roomId' });
    }
    
    const teamRef = db.collection('teams').doc(name);
    const teamDoc = await teamRef.get();
    
    let completedRooms = [];
    if (teamDoc.exists) {
      const team = teamDoc.data();
      completedRooms = team.completedRooms || [];
    }
    
    const accessCheck = canProgressToRoom(completedRooms, targetRoom);
    
    res.json({
      ok: true,
      ...accessCheck,
      completedRooms,
      targetRoom
    });
  } catch (error) {
    console.error('Error checking room access:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/rooms/objectives
 * Obter lista de objetivos de todas as rooms
 */
router.get('/rooms/objectives', (req, res) => {
  try {
    const objectives = ROOM_ORDER.map((roomId, index) => ({
      position: index + 1,
      id: roomId,
      ...ROOM_OBJECTIVES[roomId],
      points: ROOM_POINTS[roomId]
    }));
    
    res.json({ ok: true, objectives });
  } catch (error) {
    console.error('Error getting objectives:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/room1/login
 * Simulate Room 1 login challenge (Alice/secret123)
 */
router.post('/room1/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded check for Room 1 challenge
    if (username === 'Alice' && password === 'secret123') {
      const token = 'fake_token_' + Date.now();
      res.json({ 
        ok: true, 
        token,
        message: 'Login successful'
      });
    } else {
      res.json({ 
        ok: false, 
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Error in room1/login:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/room1/checkout
 * Simulate Room 1 checkout with IVA bug demonstration
 */
router.post('/room1/checkout', (req, res) => {
  try {
    const { cart, discountCode, shippingAddress } = req.body;
    
    if (!cart || !Array.isArray(cart)) {
      return res.status(400).json({ ok: false, error: 'Invalid cart' });
    }
    
    // Calculate subtotal
    let subtotalCents = 0;
    const lines = [];
    
    for (const item of cart) {
      const lineTotalCents = (item.qty || 0) * (item.priceCents || 0);
      subtotalCents += lineTotalCents;
      lines.push({
        sku: item.sku,
        qty: item.qty,
        priceCents: item.priceCents,
        lineTotalCents
      });
    }
    
    // Calculate discount (10% for WELCOME10)
    let discountCents = 0;
    if (discountCode === 'WELCOME10') {
      discountCents = Math.round(subtotalCents * 0.10);
    }
    
    // Calculate shipping (flat rate for PT)
    const country = (shippingAddress || {}).country || 'PT';
    let shippingCents = 0;
    if (country === 'PT') {
      shippingCents = 450; // 4.50 EUR
    }
    
    // BUG: IVA calcula errado! (propositado para o desafio)
    // A base deveria ser: (subtotal - discount + shipping)
    // Mas o código legacy calcula sobre: subtotal (antes de aplicar discount e shipping)
    const taxableCents = subtotalCents; // BUG: deveria ser (subtotalCents - discountCents + shippingCents)
    const taxCents = Math.round(taxableCents * 0.23);
    
    const totalCents = subtotalCents - discountCents + shippingCents + taxCents;
    
    const order = {
      id: 'ord_' + Date.now(),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      lines,
      amounts: {
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents
      }
    };
    
    res.json({ 
      ok: true, 
      order 
    });
  } catch (error) {
    console.error('Error in room1/checkout:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.use('/api', router);
app.use('/', router);

// Export as Cloud Function
exports.api = functions.https.onRequest(app);
