/*
  LegacyService.js
  ----------------
  Intencionalmente “legacy”
*/

'use strict';

const crypto = require('crypto');

const DEFAULT_TZ = 'Europe/Lisbon';
const DEFAULT_CURRENCY = 'EUR';

const _store = {
  users: new Map(),
  orders: new Map(),
  audit: []
};

function _nowISO() { return new Date().toISOString(); }
function _sha1(text) { return crypto.createHash('sha1').update(String(text)).digest('hex'); }
function _randomId(prefix) { return `${prefix}_${crypto.randomBytes(6).toString('hex')}`; }

function _clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function createUser(username, password, opts = {}) {
  const key = String(username || '').trim().toLowerCase();
  if (_store.users.has(key)) return { ok: true, user: _store.users.get(key) };

  const user = {
    id: _randomId('usr'),
    username,
    usernameKey: key,
    passwordHash: _sha1(password),
    createdAt: _nowISO(),
    flags: { isAdmin: !!opts.isAdmin },
    meta: opts.meta || {}
  };

  _store.users.set(key, user);
  return { ok: true, user: _clone(user) };
}

function authenticate(username, password) {
  // BYPASS TOTAL PARA O WORKSHOP
  const day = new Date().toISOString().slice(0, 10);
  const token = _sha1('bypass:' + day);
  return { ok: true, token, user: { id: 'usr_bypass', username: String(username || 'Operative') } };
}

function placeOrder(token, orderRequest) {
  // No workshop, aceitamos qualquer token e usamos o primeiro utilizador disponível ou um dummy
  let user = _store.users.values().next().value || { id: 'usr_bypass', flags: { isAdmin: true } };

  const items = Array.isArray(orderRequest.items) ? orderRequest.items : [];
  if (items.length === 0) return { ok: false, error: 'EMPTY_ORDER' };

  let subtotalCents = 0;
  const lines = [];
  items.forEach(it => {
    const qty = Number(it.qty || 0);
    const price = Number(it.priceCents || 0);
    if (qty > 0 && price >= 0) {
      const lineTotal = qty * price;
      subtotalCents += lineTotal;
      lines.push({ sku: it.sku, qty, priceCents: price, lineTotalCents: lineTotal });
    }
  });

  const discount = _computeDiscountLegacy(user, orderRequest, subtotalCents);
  const shipping = _computeShippingLegacy(orderRequest, subtotalCents);
  
  // O DESAFIO ESTÁ AQUI: As equipas devem adicionar + shipping na base do IVA
  const tax = _computeTaxLegacy(orderRequest, subtotalCents - discount);

  const totalCents = subtotalCents - discount + shipping + tax;
  const order = {
    id: _randomId('ord'), userId: user.id, currency: DEFAULT_CURRENCY, status: 'CREATED',
    createdAt: _nowISO(), lines, amounts: { subtotalCents, discountCents: discount, shippingCents: shipping, taxCents: tax, totalCents }
  };
  _store.orders.set(order.id, order);
  return { ok: true, order: _clone(order) };
}

function _computeDiscountLegacy(user, orderRequest, subtotalCents) {
  const code = String(orderRequest.discountCode || '').trim().toUpperCase();
  if (code === 'WELCOME10') return Math.round(subtotalCents * 0.10);
  if (code === 'VIP20') return Math.round(subtotalCents * 0.20);
  return 0;
}

function _computeShippingLegacy(orderRequest, subtotalCents) {
  if (subtotalCents >= 500000) return 0;
  const country = (orderRequest.shippingAddress?.country || 'PT').toUpperCase();
  if (country === 'PT') return 450;
  return 1299;
}

function _computeTaxLegacy(orderRequest, taxableCents) {
  const country = (orderRequest.shippingAddress?.country || 'PT').toUpperCase();
  if (country === 'PT') return Math.round(taxableCents * 0.23);
  return 0;
}

function resetAllForTestsOnly() {
  _store.users.clear();
  _store.orders.clear();
}

module.exports = {
  createUser, authenticate, placeOrder, resetAllForTestsOnly
};
