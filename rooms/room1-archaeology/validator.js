/**
 * Room 1 Archaeology - Automatic IVA Bug Validator
 * Objetivo: Encontrar e corrigir o bug no cálculo de IVA
 */

class Room1Validator {
  constructor() {
    this.roomId = 'room1';
    this.objectiveName = 'Arqueologia de Código - Bug de IVA';
  }

  /**
   * Validates that the IVA calculation bug has been fixed
   * Bug: 2000 - 200 + 450 = 2250 base (correto)
   * Imposto: 2250 * 0.23 = 517.50€ (correto)
   * O código estava calculando errado (460€ em vez de 517.50€)
   */
  async validate(submissionData) {
    const result = {
      status: 'validating',
      errors: [],
      warnings: [],
      passed: false,
      details: {}
    };

    try {
      // 1. Verificar tipos de dados
      if (!submissionData.code) {
        result.errors.push({
          type: 'error',
          message: 'Código não fornecido',
          severity: 'critical'
        });
        result.status = 'failure';
        return result;
      }

      // 2. Procurar padrões de correção de IVA
      const hasCorrectCalculation = this._checkIVACalculation(submissionData.code);
      if (!hasCorrectCalculation) {
        result.errors.push({
          type: 'error',
          message: 'Cálculo de IVA ainda está incorreto. Verifica a fórmula de imposto.',
          severity: 'critical',
          hint: 'Base = (preço - desconto + shipping). Imposto = base * 0.23'
        });
      } else {
        result.details.ivaCalculationFixed = true;
      }

      // 3. Verificar se explicação foi preenchida
      if (!submissionData.explanation || submissionData.explanation.trim().length < 20) {
        result.errors.push({
          type: 'error',
          message: 'Explicação do bug é obrigatória e deve ter pelo menos 20 caracteres',
          severity: 'critical'
        });
      } else {
        result.details.explanationProvided = true;
      }

      // 4. Procurar keywords de compreensão
      const explanationLower = (submissionData.explanation || '').toLowerCase();
      const hasKeywords = /desconto|shipping|base|imposto|taxa|0\.23/.test(explanationLower);
      if (!hasKeywords) {
        result.warnings.push({
          type: 'warning',
          message: 'Explicação não menciona conceitos-chave (desconto, shipping, base, imposto)',
          severity: 'minor'
        });
      } else {
        result.details.conceptsUnderstood = true;
      }

      // 5. Resultado final
      if (result.errors.length === 0) {
        result.passed = true;
        result.status = 'success';
        result.details.score = 100;
        result.details.completeTime = submissionData.completionTime;
      } else {
        result.status = 'failure';
      }

      result.timestamp = new Date().toISOString();
      return result;

    } catch (error) {
      result.status = 'failure';
      result.errors.push({
        type: 'error',
        message: `Erro ao validar: ${error.message}`,
        severity: 'critical'
      });
      return result;
    }
  }

  /**
   * Check if IVA calculation follows correct formula
   */
  _checkIVACalculation(code) {
    // Procurar padrões que indicam cálculo correto de imposto
    const patterns = [
      /base\s*=\s*\(\s*price\s*-\s*discount\s*\+\s*shipp/i,
      /tax\s*=\s*base\s*\*\s*0\.?23/i,
      /total\s*=\s*base\s*\+\s*tax/i,
      /517\.5|517\.50/i, // Valor correto para teste específico
    ];

    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Get user-friendly error message
   */
  getErrorFeedback(result) {
    if (result.passed) {
      return {
        title: '✅ Parabéns! Bug fixado!',
        message: 'O cálculo de IVA está correto! Podes avançar para a próxima room.',
        nextRoom: 'room2',
        icon: '🟢'
      };
    }

    const errorMessages = result.errors.map(e => e.message);
    return {
      title: '❌ Validação Falhou',
      message: errorMessages.join('\n'),
      hint: 'Dica: ' + (result.errors[0]?.hint || 'Verifica o código novamente'),
      nextRoom: null,
      icon: '🔴'
    };
  }
}

// Exportar para uso em room1
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Room1Validator;
}
