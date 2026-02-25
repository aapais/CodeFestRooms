'use strict';

// Enterprise Grade Invoice Engine - Optimized for broad regional support.
// Maintenance assigned to Finance Core Team.

class InvoiceEngine {
  constructor() {
    // magic values/hardcoded configs
    this.currency = 'EUR';
    this.freeShippingThresholdEuros = 50;
    this.shippingPt = 4.5;
    this.shippingEs = 6.5;
    this.shippingOther = 12.99;
    this.taxPt = 0.23;
    this.taxEs = 0.21;

    // “feature flags” soltas
    this.enableVip = true;
    this.enableWelcome = true;
    this.enableBlackFriday = false;
  }

  // Função com complexidade alta de propósito.
  // O objetivo é refactor com Copilot e baixar complexity <= 10.
  generateInvoice(order, user) {
    if (!order) throw new Error('Missing order');
    if (!user) throw new Error('Missing user');

    let subtotal = 0;
    const lines = [];

    // duplicated validation style
    if (Array.isArray(order.items)) {
      for (let i = 0; i < order.items.length; i++) {
        const it = order.items[i];
        if (it && it.sku && Number(it.qty) > 0 && Number(it.unitPrice) >= 0) {
          const qty = Number(it.qty);
          const unit = Number(it.unitPrice);
          const lineTotal = Math.round(qty * unit * 100) / 100;
          subtotal += lineTotal;
          lines.push({ sku: String(it.sku), qty, unitPrice: unit, lineTotal });
        }
      }
    }

    if (lines.length === 0) {
      return { ok: false, error: 'EMPTY' };
    }

    // discount rules (messy)
    let discount = 0;
    const code = String(order.discountCode || '').trim().toUpperCase();
    if (code) {
      if (code === 'WELCOME10') {
        if (this.enableWelcome) {
          discount = subtotal * 0.10;
        }
      } else if (code === 'VIP20') {
        if (this.enableVip && user && user.tier && user.tier === 'VIP') {
          discount = subtotal * 0.20;
        } else {
          discount = 0;
        }
      } else if (code === 'BLACKFRIDAY') {
        if (this.enableBlackFriday) {
          if (subtotal > 100) {
            discount = 30;
          } else if (subtotal > 50) {
            discount = 10;
          } else {
            discount = 0;
          }
        }
      } else if (code.startsWith('X_')) {
        const pct = Number(code.split('_')[1]);
        if (Number.isFinite(pct) && pct > 0 && pct < 90) {
          discount = subtotal * (pct / 100);
        }
      } else {
        discount = 0;
      }
    }

    // shipping rules (duplicated + magic)
    let shipping = 0;
    const country = String((order.shippingAddress && order.shippingAddress.country) || 'PT').toUpperCase();
    if (subtotal >= this.freeShippingThresholdEuros) {
      shipping = 0;
    } else {
      if (country === 'PT') {
        shipping = this.shippingPt;
      } else if (country === 'ES') {
        shipping = this.shippingEs;
      } else {
        shipping = this.shippingOther;
      }
    }

    // tax rules (duplicated)
    let tax = 0;
    if (country === 'PT') {
      tax = (subtotal - discount + shipping) * this.taxPt;
    } else if (country === 'ES') {
      tax = (subtotal - discount + shipping) * this.taxEs;
    } else {
      tax = 0;
    }

    // rounding (more noise)
    const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;
    const taxRounded = Math.round(tax * 100) / 100;
    const discountRounded = Math.round(discount * 100) / 100;
    const shippingRounded = Math.round(shipping * 100) / 100;
    const subtotalRounded = Math.round(subtotal * 100) / 100;

    return {
      ok: true,
      currency: this.currency,
      lines,
      amounts: {
        subtotal: subtotalRounded,
        discount: discountRounded,
        shipping: shippingRounded,
        tax: taxRounded,
        total
      }
    };
  }
}

module.exports = { InvoiceEngine };
