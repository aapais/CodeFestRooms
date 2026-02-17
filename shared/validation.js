/**
 * Shared Validation Module for Visual Escape Room
 * Provides common validation utilities and base class
 */

const VALIDATION_RESULT = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  SUCCESS: 'success',
  FAILURE: 'failure'
};

/**
 * Base validator class - extend this in each room
 */
class RoomValidator {
  constructor(roomId) {
    this.roomId = roomId;
    this.status = VALIDATION_RESULT.PENDING;
    this.errors = [];
    this.warnings = [];
    this.metadata = {};
  }

  /**
   * Main validation entry point - override in subclass
   */
  async validate(code, context = {}) {
    throw new Error('validate() must be implemented in subclass');
  }

  /**
   * Add validation error
   */
  addError(message, details = {}) {
    this.errors.push({
      type: 'error',
      message,
      severity: 'critical',
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add validation warning
   */
  addWarning(message, details = {}) {
    this.warnings.push({
      type: 'warning',
      message,
      severity: 'minor',
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Format validation result for UI
   */
  formatResult() {
    const isValid = this.errors.length === 0;
    
    return {
      valid: isValid,
      status: isValid ? VALIDATION_RESULT.SUCCESS : VALIDATION_RESULT.FAILURE,
      roomId: this.roomId,
      errors: this.errors,
      warnings: this.warnings,
      metadata: this.metadata,
      summary: this.generateSummary(),
      suggestions: this.generateSuggestions()
    };
  }

  /**
   * Generate human-friendly summary
   */
  generateSummary() {
    if (this.errors.length === 0) {
      return `✅ Validação passou! Objetivo cumprido para ${this.roomId}.`;
    }

    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;
    
    let summary = `❌ Validação falhou (${errorCount} erro${errorCount !== 1 ? 's' : ''})`;
    if (warningCount > 0) {
      summary += ` e ${warningCount} aviso${warningCount !== 1 ? 's' : ''}`;
    }
    
    return summary + '.';
  }

  /**
   * Generate suggestions for fixing errors
   */
  generateSuggestions() {
    return this.errors
      .filter(e => e.details?.suggestion)
      .map(e => e.details.suggestion);
  }

  /**
   * Safe code evaluation with timeout
   */
  async evaluateCode(code, testFunction, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Code evaluation timed out after ${timeout}ms`));
      }, timeout);

      try {
        // Run in sandboxed context
        const result = testFunction.call(null, code);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Parse and validate JSON safely
   */
  safeJsonParse(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Check if code contains specific patterns
   */
  codeContains(code, patterns) {
    const results = {};
    
    patterns.forEach(pattern => {
      const regex = typeof pattern === 'string' 
        ? new RegExp(pattern, 'i')
        : pattern;
      results[pattern.toString()] = regex.test(code);
    });

    return results;
  }

  /**
   * Extract function from code
   */
  extractFunction(code, functionName) {
    const regex = new RegExp(
      `(?:function|const|let|var)\\s+${functionName}\\s*=\\s*(?:\\(.*?\\)|async.*?)\\s*=>?\\s*{.*?}`,
      'is'
    );
    const match = code.match(regex);
    return match ? match[0] : null;
  }

  /**
   * Check for common security issues
   */
  checkSecurityPatterns(code) {
    const issues = [];

    // XSS patterns
    if (/innerHTML\s*[=+]/.test(code) && !code.includes('DOMPurify')) {
      issues.push({
        type: 'XSS_VULNERABILITY',
        pattern: 'innerHTML',
        message: 'innerHTML pode causar XSS. Usa textContent ou DOMPurify.',
        severity: 'critical'
      });
    }

    // SQL Injection patterns
    if (/query\s*\+|sql\s*\+|`.*?\$\{.*?\}`/.test(code) && !code.includes('?')) {
      issues.push({
        type: 'SQL_INJECTION',
        pattern: 'string concatenation in query',
        message: 'SQL com concatenação de strings. Usa parameterized queries (?).',
        severity: 'critical'
      });
    }

    // Hardcoded secrets
    if (/password\s*[=:]\s*['"]|api[_-]?key\s*[=:]\s*['"]|secret\s*[=:]\s*['"]/.test(code)) {
      issues.push({
        type: 'HARDCODED_SECRET',
        pattern: 'hardcoded credentials',
        message: 'Credenciais hardcoded no código. Usa variáveis de ambiente.',
        severity: 'critical'
      });
    }

    // eval() usage
    if (/\beval\s*\(/.test(code)) {
      issues.push({
        type: 'UNSAFE_EVAL',
        pattern: 'eval()',
        message: 'eval() é perigoso. Encontra alternativa mais segura.',
        severity: 'critical'
      });
    }

    return issues;
  }

  /**
   * Measure code complexity (simple heuristic)
   */
  measureComplexity(code) {
    let complexity = 1; // Base complexity

    // Count conditionals
    const ifCount = (code.match(/\bif\b/g) || []).length;
    const switchCount = (code.match(/\bswitch\b/g) || []).length;
    const ternaryCount = (code.match(/\?/g) || []).length;
    
    complexity += ifCount * 1;
    complexity += switchCount * 1;
    complexity += ternaryCount * 0.5;

    // Count loops
    const loopCount = (code.match(/\b(for|while|do)\b/g) || []).length;
    complexity += loopCount * 1;

    // Count nested levels (simplified - count braces)
    const braceDepth = this.calculateNestingDepth(code);
    complexity += braceDepth * 0.5;

    return Math.round(complexity * 10) / 10;
  }

  calculateNestingDepth(code) {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }
}

/**
 * Room Transition Validator
 * Manages progression between rooms based on objective completion
 */
class RoomTransitionValidator {
  constructor() {
    this.roomSequence = [
      'room1-archaeology',
      'room2-refactor-lab',
      'room3-security-vault',
      'final-modernisation'
    ];

    this.roomObjectives = {
      'room1-archaeology': {
        name: '🏺 Arqueologia de Código',
        objective: 'Encontrar e corrigir o bug no cálculo de IVA',
        description: 'Formula correta: base = (preço - desconto + shipping); imposto = base * 0.23',
        completionCriteria: ['ivaCalculationFixed', 'explanationProvided'],
        points: 100
      },
      'room2-refactor-lab': {
        name: '🔧 Laboratório de Refatorização',
        objective: 'Refatorizar código para seguir boas práticas',
        description: 'Melhorar legibilidade, performance e manutenibilidade',
        completionCriteria: ['codeQualityImproved', 'testsPass'],
        points: 150
      },
      'room3-security-vault': {
        name: '🔒 Cofre de Segurança',
        objective: 'Corrigir vulnerabilidades de segurança',
        description: 'Eleminar XSS, SQL Injection, hardcoded secrets',
        completionCriteria: ['securityFixed', 'noVulnerabilities'],
        points: 150
      },
      'final-modernisation': {
        name: '🚀 Modernização Final',
        objective: 'Implementar arquitetura moderna e melhores práticas',
        description: 'Integrar todas as competências em solução completa',
        completionCriteria: ['fullModernization', 'allTestsPass'],
        points: 200
      }
    };

    this.completedRooms = new Map(); // teamId -> Set<roomId>
    this.validationResults = new Map(); // teamId+roomId -> ValidationResult
  }

  /**
   * Can team progress to next room?
   * Returns: { canProgress: boolean, reason?: string, nextRoom?: string }
   */
  canProgressToRoom(teamId, targetRoomId) {
    // Check if target room exists
    const targetIndex = this.roomSequence.indexOf(targetRoomId);
    if (targetIndex === -1) {
      return {
        canProgress: false,
        reason: `❌ Sala ${targetRoomId} não existe`,
        currentRoom: this.getCurrentRoom(teamId)
      };
    }

    // First room - always allowed
    if (targetIndex === 0) {
      return {
        canProgress: true,
        currentRoom: targetRoomId,
        message: '✅ Bem-vindo ao escape room!'
      };
    }

    // Get current completed rooms for this team
    const completed = this.completedRooms.get(teamId) || new Set();

    // Must complete previous room first
    const previousRoomId = this.roomSequence[targetIndex - 1];
    if (!completed.has(previousRoomId)) {
      const prevRoom = this.roomObjectives[previousRoomId];
      return {
        canProgress: false,
        reason: `❌ Primeiro completa a sala anterior: "${prevRoom.name}"`,
        blockedBy: previousRoomId,
        currentRoom: this.getCurrentRoom(teamId)
      };
    }

    return {
      canProgress: true,
      currentRoom: targetRoomId,
      message: `✅ Bem-vindo a ${this.roomObjectives[targetRoomId].name}!`
    };
  }

  /**
   * Mark room as completed when validation passes
   */
  markRoomCompleted(teamId, roomId, validationResult) {
    if (!this.completedRooms.has(teamId)) {
      this.completedRooms.set(teamId, new Set());
    }

    if (validationResult.valid !== false && validationResult.status === VALIDATION_RESULT.SUCCESS) {
      this.completedRooms.get(teamId).add(roomId);
      
      // Store validation result
      const resultKey = `${teamId}#${roomId}`;
      this.validationResults.set(resultKey, {
        ...validationResult,
        completedAt: new Date().toISOString(),
        points: this.roomObjectives[roomId]?.points || 0
      });

      return {
        success: true,
        message: `✅ Sala ${roomId} completada!`,
        points: this.roomObjectives[roomId]?.points,
        nextRoomHint: this.getNextRoomHint(teamId, roomId)
      };
    }

    return {
      success: false,
      message: '❌ Validação falhou. Tenta novamente!',
      errors: validationResult.errors
    };
  }

  /**
   * Get hint about next available room
   */
  getNextRoomHint(teamId, currentRoomId) {
    const currentIndex = this.roomSequence.indexOf(currentRoomId);
    if (currentIndex === -1 || currentIndex >= this.roomSequence.length - 1) {
      return {
        nextRoom: null,
        message: '🎉 Parabéns! Completaste todas as salas!'
      };
    }

    const nextRoomId = this.roomSequence[currentIndex + 1];
    const nextRoom = this.roomObjectives[nextRoomId];
    
    return {
      nextRoom: nextRoomId,
      name: nextRoom.name,
      objective: nextRoom.objective,
      message: `🔜 Próxima sala disponível: ${nextRoom.name}`,
      points: nextRoom.points
    };
  }

  /**
   * Get current room for team
   */
  getCurrentRoom(teamId) {
    const completed = this.completedRooms.get(teamId) || new Set();
    
    for (let i = 0; i < this.roomSequence.length; i++) {
      if (!completed.has(this.roomSequence[i])) {
        return this.roomSequence[i];
      }
    }

    return null; // All rooms completed
  }

  /**
   * Get team progress overview
   */
  getTeamProgress(teamId) {
    const completed = this.completedRooms.get(teamId) || new Set();
    const currentRoom = this.getCurrentRoom(teamId);
    
    const progress = {
      teamId,
      currentRoom,
      totalPoints: 0,
      completedCount: completed.size,
      totalCount: this.roomSequence.length,
      progressPercentage: Math.round((completed.size / this.roomSequence.length) * 100),
      rooms: []
    };

    this.roomSequence.forEach((roomId, index) => {
      const isCompleted = completed.has(roomId);
      const isLocked = index > 0 && !completed.has(this.roomSequence[index - 1]);
      const roomData = this.roomObjectives[roomId];
      
      if (isCompleted) {
        progress.totalPoints += roomData.points;
      }

      progress.rooms.push({
        id: roomId,
        position: index + 1,
        name: roomData.name,
        status: isCompleted ? 'completed' : isLocked ? 'locked' : 'available',
        objective: roomData.objective,
        points: roomData.points,
        completed: isCompleted,
        locked: isLocked,
        isCurrent: roomId === currentRoom
      });
    });

    return progress;
  }

  /**
   * Get all room objectives for UI reference
   */
  getAllRoomObjectives() {
    return this.roomSequence.map((roomId, index) => ({
      position: index + 1,
      id: roomId,
      ...this.roomObjectives[roomId]
    }));
  }

  /**
   * Validate complete game progression
   */
  isGameComplete(teamId) {
    const completed = this.completedRooms.get(teamId) || new Set();
    return completed.size === this.roomSequence.length;
  }

  /**
   * Get total team score from completed rooms
   */
  calculateTeamScore(teamId) {
    const completed = this.completedRooms.get(teamId) || new Set();
    let totalScore = 0;

    completed.forEach(roomId => {
      const roomObjective = this.roomObjectives[roomId];
      if (roomObjective) {
        totalScore += roomObjective.points;
      }
    });

    return totalScore;
  }

  /**
   * Reset team progress (for debugging/admin)
   */
  resetTeamProgress(teamId) {
    this.completedRooms.delete(teamId);
    
    // Clear validation results for this team
    for (const key of this.validationResults.keys()) {
      if (key.startsWith(teamId + '#')) {
        this.validationResults.delete(key);
      }
    }

    return {
      success: true,
      message: `🔄 Progresso da equipa ${teamId} foi reiniciado`,
      currentRoom: this.roomSequence[0]
    };
  }
}

/**
 * Export for use in room validators
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RoomValidator,
    RoomTransitionValidator,
    VALIDATION_RESULT
  };
}
