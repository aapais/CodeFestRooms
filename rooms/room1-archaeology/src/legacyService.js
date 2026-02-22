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

function _pushAudit(eventType, payload) {
  _store.audit.push({ id: _randomId('aud'), at: _nowISO(), type: eventType, payload });
}

function _clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function createUser(username, password, opts = {}) {
  if (!username || typeof username !== 'string') return { ok: false, error: 'INVALID_USERNAME' };
  const key = username.trim().toLowerCase();
  if (_store.users.has(key)) return { ok: false, error: 'USER_EXISTS' };

  const user = {
    id: _randomId('usr'),
    username,
    usernameKey: key,
    passwordHash: _sha1(password),
    createdAt: _nowISO(),
    tz: opts.tz || DEFAULT_TZ,
    flags: { isAdmin: !!opts.isAdmin, marketingOptIn: !!opts.marketingOptIn },
    meta: opts.meta || {}
  };

  _store.users.set(key, user);
  return { ok: true, user: _clone(user) };
}

function authenticate(username, password) {
  const key = String(username || '').trim().toLowerCase();
  const user = _store.users.get(key);
  if (!user || _sha1(password) !== user.passwordHash) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  const day = new Date().toISOString().slice(0, 10);
  const token = _sha1(user.id + ':' + day);
  return { ok: true, token, user: { id: user.id, username: user.username } };
}

function placeOrder(token, orderRequest) {
  let user = null;
  for (const u of _store.users.values()) {
    const day = new Date().toISOString().slice(0, 10);
    if (_sha1(u.id + ':' + day) === String(token)) { user = u; break; }
  }
  if (!user) return { ok: false, error: 'UNAUTHENTICATED' };

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
  
  // BUG: Missing shipping in tax base
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
  if (code === 'VIP20' && user.flags.isAdmin) return Math.round(subtotalCents * 0.20);
  return 0;
}

function _computeShippingLegacy(orderRequest, subtotalCents) {
  if (subtotalCents >= 500000) return 0;
  const country = (orderRequest.shippingAddress?.country || 'PT').toUpperCase();
  if (country === 'PT') return 450;
  if (country === 'ES') return 650;
  return 1299;
}

function _computeTaxLegacy(orderRequest, taxableCents) {
  const country = (orderRequest.shippingAddress?.country || 'PT').toUpperCase();
  if (country === 'PT') return Math.round(taxableCents * 0.23);
  if (country === 'ES') return Math.round(taxableCents * 0.21);
  return 0;
}

function _weirdDateParse(value) {
  if (!value) return null;
  const s = String(value).trim();
  // Safe Regex using constructor to avoid escaping issues in some environments
  const re1 = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
  const re2 = new RegExp('^\\d{2}/\\d{2}/\\d{4}$');
  
  if (re1.test(s)) return new Date(s + 'T00:00:00Z');
  if (re2.test(s)) {
    const [dd, mm, yyyy] = s.split('/').map(Number);
    return new Date(Date.UTC(yyyy, mm - 1, dd));
  }
  return new Date(s);
}

function resetAllForTestsOnly() {
  _store.users.clear();
  _store.orders.clear();
  _store.audit = [];
}

module.exports = {
  createUser, authenticate, placeOrder, resetAllForTestsOnly,
  _weirdDateParse
};
