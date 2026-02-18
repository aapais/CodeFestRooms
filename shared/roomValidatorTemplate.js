/**
 * Room Validator Template
 * 
 * Template para criar validadores de sala específicos.
 * Criar um arquivo validator.js em cada pasta da sala que extends da classe base RoomValidator.
 * 
 * Exemplo:
 * - rooms/room1-archaeology/validator.js
 * - rooms/room2-refactor-lab/validator.js
 * - rooms/room3-security-vault/validator.js
 * - rooms/final-modernisation/validator.js
 */

/**
 * Template de Validador de Sala
 * 
 * Instruções:
 * 1. Estender da classe RoomValidator (já definida em validation.js)
 * 2. Implementar o método validate() que retorna { valid, errors, warnings, metadata }
 * 3. Adicionar métodos específicos da sala (checkXXX)
 * 4. Exportar a classe
 */

// Exemplo para Room 1 - Arqueologia
// Copiar este código para rooms/room1-archaeology/server/validator.js

const { RoomValidator, VALIDATION_RESULT } = require('../../../shared/validation.js');

class Room1Validator extends RoomValidator {
  constructor() {
    super('room1-archaeology');
    this.roomName = '🏺 Arqueologia de Código';
    this.requirements = {
      bugFixed: false,
      explanationProvided: false,
      codeQuality: false
    };
  }

  /**
   * Validação principal - executada quando submeter a solução
   * 
   * Deve retornar:
   * {
   *   valid: boolean,
   *   status: 'success' | 'failure',
   *   errors: [],
   *   warnings: [],
   *   metadata: {
   *     requirements: {},
   *     points: number,
   *     completionTime: number
   *   }
   * }
   */
  async validate(submissionData) {
    this.status = VALIDATION_RESULT.VALIDATING;
    this.errors = [];
    this.warnings = [];
    this.metadata = {};

    try {
      // 1. Validar que código foi fornecido
      if (!submissionData.code || submissionData.code.trim() === '') {
        this.addError('Código não fornecido', {
          suggestion: 'Submete o código corrigido para análise'
        });
        this.status = VALIDATION_RESULT.FAILURE;
        return this.formatResult();
      }

      // 2. Verificar se o bug foi corrigido
      const bugCheckResult = await this._checkBugFix(submissionData.code);
      if (!bugCheckResult.fixed) {
        this.addError('Bug de IVA ainda não foi corrigido', {
          suggestion: 'Formula correta: base = (preço - desconto + shipping); tax = base * 0.23'
        });
      } else {
        this.requirements.bugFixed = true;
      }

      // 3. Verificar explicação
      const explanationCheck = this._checkExplanation(submissionData.explanation);
      if (!explanationCheck.valid) {
        this.addError(explanationCheck.error, {
          suggestion: 'Explica o bug e como o corrigiste (mínimo 50 caracteres)'
        });
      } else {
        this.requirements.explanationProvided = true;
      }

      // 4. Verificar qualidade do código
      const codeQualityCheck = this._checkCodeQuality(submissionData.code);
      if (!codeQualityCheck.passed) {
        this.addWarning(codeQualityCheck.message, {
          issues: codeQualityCheck.issues
        });
      } else {
        this.requirements.codeQuality = true;
      }

      // 5. Segurança
      const securityIssues = this.checkSecurityPatterns(submissionData.code);
      securityIssues.forEach(issue => {
        this.addError(`Potencial vulnerabilidade: ${issue.message}`, {
          type: issue.type,
          severity: issue.severity
        });
      });

      // 6. Complexidade
      const complexity = this.measureComplexity(submissionData.code);
      if (complexity > 25) {
        this.addWarning(`Código muito complexo (score: ${complexity}). Considera refatorizar.`, {
          complexity
        });
      }

      // 7. Determinar resultado final
      if (this.errors.length === 0) {
        this.status = VALIDATION_RESULT.SUCCESS;
        this.metadata = {
          requirements: this.requirements,
          points: 100,
          completionTime: submissionData.completionTime || 0,
          complexity,
          securityScore: 'passed'
        };
      } else {
        this.status = VALIDATION_RESULT.FAILURE;
      }

      return this.formatResult();

    } catch (error) {
      this.addError(`Erro na validação: ${error.message}`, {
        details: error.stack
      });
      this.status = VALIDATION_RESULT.FAILURE;
      return this.formatResult();
    }
  }

  /**
   * Verificar se o bug de IVA foi corrigido
   * @private
   */
  async _checkBugFix(code) {
    const correctPatterns = [
      // Pattern 1: Usa variável 'base'
      { regex: /base\s*=\s*\(\s*price\s*-\s*discount\s*\+\s*shipping/i, name: 'base calculation' },
      
      // Pattern 2: Calcula imposto com 0.23
      { regex: /tax\s*=\s*base\s*\*\s*0\.?23/i, name: 'tax calculation' },
      
      // Pattern 3: Total correto
      { regex: /total\s*=\s*base\s*\+\s*tax/i, name: 'total calculation' },
      
      // Pattern 4: Valor esperado para o caso de teste
      { regex: /517\.5[0]?|2250/i, name: 'correct values' }
    ];

    const matchedPatterns = [];
    correctPatterns.forEach(pattern => {
      if (pattern.regex.test(code)) {
        matchedPatterns.push(pattern.name);
      }
    });

    const fixed = matchedPatterns.length >= 3; // Precisa de pelo menos 3 padrões
    
    return {
      fixed,
      matchedPatterns,
      missingPatterns: correctPatterns
        .filter(p => !matchedPatterns.includes(p.name))
        .map(p => p.name)
    };
  }

  /**
   * Verificar explicação
   * @private
   */
  _checkExplanation(explanation) {
    if (!explanation || explanation.trim() === '') {
      return {
        valid: false,
        error: 'Explicação é obrigatória'
      };
    }

    if (explanation.length < 50) {
      return {
        valid: false,
        error: `Explicação muito curta (${explanation.length} chars). Mínimo: 50 chars`
      };
    }

    // Verificar se menciona conceitos-chave
    const keywordRegex = /bug|fix|corrig|calculo|imposto|taxa|desconto|shipping|base|0\.?23/i;
    if (!keywordRegex.test(explanation)) {
      return {
        valid: true,
        warning: 'Explicação não menciona conceitos-chave. Tenta ser mais específico.'
      };
    }

    return { valid: true };
  }

  /**
   * Verificar qualidade do código
   * @private
   */
  _checkCodeQuality(code) {
    const issues = [];

    // Verificar variáveis bem nomeadas
    if (/\bvar\s+[a-z]\s*=|double-letter/.test(code)) {
      issues.push('Variáveis com nomes curtos - usa nomes descritivos');
    }

    // Verificar comments
    if (!/\/\/|\/\*/.test(code)) {
      issues.push('Sem comments - considera documentar código importante');
    }

    // Verificar espaçamento e indentação
    const lines = code.split('\n');
    const badFormattedLines = lines.filter((line, i) => {
      // Checar indentação consistente
      const leadingSpaces = line.match(/^(\s*)/)[1].length;
      return leadingSpaces % 2 !== 0 && line.trim() !== ''; // Indentação deve ser múltiplo de 2
    }).length;

    if (badFormattedLines > lines.length * 0.2) {
      issues.push('Indentação inconsistente');
    }

    return {
      passed: issues.length === 0,
      issues,
      message: issues.length > 0 
        ? `Problemas de qualidade: ${issues.join(', ')}`
        : 'Código bem formatado e documentado'
    };
  }

  /**
   * Obter feedback amigável
   */
  getHumanFeedback() {
    const result = this.formatResult();

    if (result.valid) {
      return {
        status: '✅ PASSOU',
        title: 'Parabéns! Bug fixado!',
        message: 'O cálculo de IVA está correto agora.',
        details: result.metadata,
        nextSteps: 'Podes avançar para a próxima sala: 🔧 Laboratório de Refatorização',
        emoji: '🎉'
      };
    } else {
      return {
        status: '❌ FALHOU',
        title: 'Validação não passou',
        message: 'Existem errros para corrigir:',
        errors: result.errors,
        warnings: result.warnings,
        suggestions: result.suggestions,
        emoji: '🔴'
      };
    }
  }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Room1Validator;
}
