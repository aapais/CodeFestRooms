/**
 * Room 1 - Archaeology: IVA Bug Finder
 * Validates that the invoice calculation bug is fixed
 */

// Import validation base (note: in browser context, assumes RoomValidator is available globally)
class IVAValidator extends RoomValidator {
  constructor() {
    super('room1-archaeology');
    this.expectedIVABase = 2250; // After fixing: original 2000 - 200 discount = 1800 (WRONG)
    this.expectedIPAmount = 517.50; // 2250 * 0.23
    this.expectedTotal = 2767.50;
  }

  /**
   * Main validation logic for Room 1
   */
  async validate(invoiceData, context = {}) {
    this.errors = [];
    this.warnings = [];
    this.metadata = {};

    try {
      // Parse invoice data
      const invoice = typeof invoiceData === 'string'
        ? this.safeJsonParse(invoiceData)
        : invoiceData;

      // Validate structure
      this.validateInvoiceStructure(invoice);

      // Check IVA calculation logic
      this.validateIVACalculation(invoice);

      // Check that bug is actually fixed
      this.validateBugIsFix(invoice);

      // Check that code was modified (not original)
      if (context.originalCode && context.modifiedCode) {
        this.validateCodeModified(context.originalCode, context.modifiedCode);
      }

    } catch (error) {
      this.addError(
        `Erro durante validação: ${error.message}`,
        { originalError: error.toString() }
      );
    }

    this.metadata = {
      expectedBase: this.expectedIVABase,
      expectedIVA: this.expectedIPAmount,
      expectedTotal: this.expectedTotal,
      timestamp: new Date().toISOString()
    };

    return this.formatResult();
  }

  /**
   * Validate invoice has required fields
   */
  validateInvoiceStructure(invoice) {
    const requiredFields = ['items', 'discount', 'shipping', 'ivaRate'];

    requiredFields.forEach(field => {
      if (!(field in invoice)) {
        this.addError(
          `Campo obrigatório falta: "${field}"`,
          { field, suggestion: `Adiciona campo "${field}" ao objeto invoice` }
        );
      }
    });

    if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
      this.addError(
        'Items não pode ser vazio',
        { suggestion: 'Adiciona pelo menos um item à fatura' }
      );
    }
  }

  /**
   * Core validation: IVA calculation
   */
  validateIVACalculation(invoice) {
    try {
      // Calculate subtotal from items
      const subtotal = (invoice.items || []).reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);

      // Apply discount
      const afterDiscount = subtotal - (parseFloat(invoice.discount) || 0);

      // THE BUG FIX: Shipping should NOT affect IVA base
      // WRONG WAY: ivaBase = afterDiscount + shipping
      // RIGHT WAY: ivaBase = afterDiscount (shipping added AFTER tax)
      const ivaBase = afterDiscount;

      // Calculate IVA
      const ivaRate = parseFloat(invoice.ivaRate) || 0.23;
      const ivaAmount = ivaBase * ivaRate;

      // Total = subtotal - discount + IVA + shipping
      const total = ivaBase + ivaAmount + (parseFloat(invoice.shipping) || 0);

      // Store for metadata
      this.metadata.calculated = {
        subtotal: subtotal.toFixed(2),
        afterDiscount: afterDiscount.toFixed(2),
        ivaBase: ivaBase.toFixed(2),
        ivaRate: (ivaRate * 100).toFixed(0) + '%',
        ivaAmount: ivaAmount.toFixed(2),
        shipping: parseFloat(invoice.shipping).toFixed(2),
        total: total.toFixed(2)
      };

      // Validate calculations
      const ivaBaseDiff = Math.abs(ivaBase - this.expectedIVABase);
      if (ivaBaseDiff > 0.01) {
        this.addError(
          `Base de IVA incorreta: ${ivaBase.toFixed(2)}€ (esperado: ${this.expectedIVABase}€)`,
          {
            actual: ivaBase,
            expected: this.expectedIVABase,
            suggestion: '🔴 Lembra-te: Desconto E shipping não devem afetar a base de imposto!'
          }
        );
      }

      const ivaAmountDiff = Math.abs(ivaAmount - this.expectedIPAmount);
      if (ivaAmountDiff > 0.01) {
        this.addError(
          `Valor IVA incorreto: ${ivaAmount.toFixed(2)}€ (esperado: ${this.expectedIPAmount}€)`,
          {
            actual: ivaAmount,
            expected: this.expectedIPAmount,
            suggestion: 'Verifica o cálculo do imposto. Base correta?'
          }
        );
      }

      const totalDiff = Math.abs(total - this.expectedTotal);
      if (totalDiff > 0.01) {
        this.addWarning(
          `Total final diferente: ${total.toFixed(2)}€ (esperado: ${this.expectedTotal}€)`,
          {
            actual: total,
            expected: this.expectedTotal
          }
        );
      }

    } catch (error) {
      this.addError(
        `Erro ao calcular IVA: ${error.message}`,
        {
          suggestion: 'Verifica se invoice tem structure correta (items, discount, shipping, ivaRate)'
        }
      );
    }
  }

  /**
   * Verify the original bug is fixed
   */
  validateBugIsFix(invoice) {
    // The bug: shipping was being added to the IVA base
    // We detect this by checking if the logic is wrong
    
    const bugSignPatterns = [
      /ivaBase\s*=.*(shipping|envio)/i,
      /base\s*=.*(discount|desconto).*\+\s*(shipping|envio)/i,
      /taxa|tax|iva.*=.*(\w+)\s*\+\s*(shipping|envio)/i
    ];

    // If we can access the code, check it
    if (this.metadata.codeAnalyzed) {
      const codeHasBug = bugSignPatterns.some(pattern => 
        pattern.test(this.metadata.codeAnalyzed)
      );

      if (codeHasBug) {
        this.addError(
          'Bug detectado: Shipping está a afetar a base de imposto',
          {
            suggestion: '💡 O cálculo correto é: ivaBase = subtotal - desconto (sem shipping adicionar!) Shipping vem DEPOIS do imposto.'
          }
        );
      }
    }
  }

  /**
   * Verify code was actually modified
   */
  validateCodeModified(originalCode, modifiedCode) {
    if (originalCode === modifiedCode) {
      this.addError(
        'Código não foi alterado. Ainda tem o bug original!',
        {
          suggestion: 'Modifica a fórmula de cálculo do IVA para cor realmente corrigir o bug'
        }
      );
    }

    // Check that at least one critical line differs
    const originalLines = originalCode.split('\n').filter(l => l.includes('iva') || l.includes('taxa'));
    const modifiedLines = modifiedCode.split('\n').filter(l => l.includes('iva') || l.includes('taxa'));

    if (JSON.stringify(originalLines) === JSON.stringify(modifiedLines)) {
      this.addWarning(
        'Partes críticas do código não parecem ter sido modificadas',
        {
          suggestion: 'Certifica-te que alteraste a lógica de cálculo do shipping e imposto'
        }
      );
    }
  }
}

// Export for Node.js or browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IVAValidator;
}
