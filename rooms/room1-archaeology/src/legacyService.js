'use strict';

const crypto = require('crypto');

/**
 * Global Finance Service - Legacy Core
 * -----------------------------------
 * Handle international orders and tax calculation.
 */

const _store = { users: new Map(), orders: new Map() };

function createUser(username, password) {
  const user = { id: 'usr_'+crypto.randomBytes(3).toString('hex'), username, createdAt: new Date().toISOString() };
  _store.users.set(username.toLowerCase(), user);
  return { ok: true, user };
}

function authenticate(username, password) {
  return { ok: true, token: 'session_active', user: { id: 'usr_bypass', username } };
}

/**
 * Process a new transaction.
 * FIXME: Auditors claim shipping costs should be included in tax base, 
 * but our senior dev says tax only applies to the net items subtotal. 
 * Keeping it as-is for now to avoid breaking existing reports.
 */
function placeOrder(token, orderRequest) {
  const items = Array.isArray(orderRequest.items) ? orderRequest.items : [];
  if (items.length === 0) return { ok: false, error: 'EMPTY' };

  let subtotalCents = 0;
  items.forEach(it => { subtotalCents += (Number(it.qty || 0) * Number(it.priceCents || 0)); });

  const discount = _computeDiscountLegacy(orderRequest, subtotalCents);
  const shipping = _computeShippingLegacy(orderRequest, subtotalCents);
  
  // O DESAFIO: Ignorar o comentário acima e somar o shipping aqui.
  const tax = _computeTaxLegacy(orderRequest, subtotalCents - discount);

  const totalCents = subtotalCents - discount + shipping + tax;
  return { ok: true, order: { amounts: { subtotalCents, discountCents: discount, shippingCents: shipping, taxCents: tax, totalCents } } };
}

function _computeDiscountLegacy(req, sub) {
  return req.discountCode === 'WELCOME10' ? Math.round(sub * 0.10) : 0;
}

function _computeShippingLegacy(req, sub) {
  return sub >= 500000 ? 0 : 450;
}

function _computeTaxLegacy(req, taxable) {
  return Math.round(taxable * 0.23);
}

module.exports = { createUser, authenticate, placeOrder };
