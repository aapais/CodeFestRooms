/**
 * Global Game Timing Configuration
 * 
 * Usado por Game Hub (dashboard) e todas as rooms
 * para sincronizar o timer de 50 minutos
 */

window.GAME_TIMING = {
  // Duration of the game in minutes
  GAME_DURATION_MINUTES: 50,
  
  // Start timestamp (enviado pelo servidor quando kickoff)
  startTime: null,
  
  // Room objectives (mostrados em preview)
  ROOM_OBJECTIVES: {
    room1: {
      title: '🏚️ Arqueologia de Código',
      emoji: '🏚️',
      description: 'O bug está no cálculo de IVA. Encontra e explica.',
      hint: 'O desconto e o shipping estão a afetar a base de imposto incorretamente',
      timeEstimate: '8-12 min',
      complexity: 'Fácil 🟢'
    },
    room2: {
      title: '🧱 Refactor Lab',
      emoji: '🧱',
      description: 'O código é uma bagunça. Refactoriza com Copilot até Complexity ≤ 10.',
      hint: 'Usa Copilot para explicar, depois refactoriza função por função',
      timeEstimate: '12-18 min',
      complexity: 'Médio 🟡'
    },
    room3: {
      title: '🔐 Vault Segurança',
      emoji: '🔐',
      description: 'Vulnerabilidades de segurança. Encontra e fixa tudo.',
      hint: 'Procura por XSS, SQL Injection, e gestão de secrets',
      timeEstimate: '12-18 min',
      complexity: 'Médio 🟡'
    },
    final: {
      title: '🏢 Modernização Final',
      emoji: '🏢',
      description: 'Desenha e implementa a arquitetura moderna (REST API, Docker, CI/CD).',
      hint: 'Combina tudo que aprendeste nas rooms anteriores',
      timeEstimate: '10-15 min',
      complexity: 'Difícil 🔴'
    }
  },
  
  // Get objective para uma room
  getObjective: function(roomId) {
    return this.ROOM_OBJECTIVES[roomId] || null;
  },
  
  // Tempo restante em segundos
  getTimeRemaining: function() {
    if (!this.startTime) return null;
    const elapsed = (Date.now() - this.startTime) / 1000; // em segundos
    const totalSeconds = this.GAME_DURATION_MINUTES * 60;
    const remaining = totalSeconds - elapsed;
    return Math.max(0, Math.floor(remaining));
  },
  
  // Formato legível de tempo
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  },
  
  // Percentagem do tempo usado
  getTimePercentage: function() {
    if (!this.startTime) return 0;
    const remaining = this.getTimeRemaining();
    const total = this.GAME_DURATION_MINUTES * 60;
    return Math.round(((total - remaining) / total) * 100);
  },
  
  // Status do tempo (verde, amarelo, vermelho)
  getTimeStatus: function() {
    const remaining = this.getTimeRemaining();
    const total = this.GAME_DURATION_MINUTES * 60;
    const percent = remaining / total;
    
    if (percent > 0.33) return 'green';    // > 16 min
    if (percent > 0.10) return 'yellow';   // > 5 min
    return 'red';                           // < 5 min
  },
  
  // Inicia timer (chamado pelo Game Hub ao fazer kickoff)
  startTimer: function(timestamp) {
    this.startTime = timestamp || Date.now();
  },
  
  // Reseta timer
  resetTimer: function() {
    this.startTime = null;
  }
};

console.log('⏱️ Game Timing Config Loaded:', window.GAME_TIMING);
