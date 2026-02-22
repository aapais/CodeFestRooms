/*
  LegacyService.js
  ----------------
  Intencionalmente “legacy”:
  - ficheiro grande
  - mistura de responsabilidades
  - nomes inconsistentes
  - branches confusos
  - algum dead code

  Objetivo do jogo: pedir ao Copilot para explicar, documentar, encontrar dead code,
  e fazer os testes passarem sem reescrever tudo.
*/

'use strict';

const crypto = require('crypto');

// “Config” hardcoded (Room 2 vai abordar isto de forma mais explícita)
const DEFAULT_TZ = 'Europe/Lisbon';
const DEFAULT_CURRENCY = 'EUR';
const LEGACY_VERSION = '3.4.1';

// Mini “db” em memória (simula um backend legacy)
const _store = {
  users: new Map(),
  orders: new Map(),
  audit: []
};

function _nowISO() {
  return new Date().toISOString();
}

function _sha1(text) {
  return crypto.createHash('sha1').update(String(text)).digest('hex');
}

function _randomId(prefix) {
  const rnd = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${rnd}`;
}

function _pushAudit(eventType, payload) {
  _store.audit.push({
    id: _randomId('aud'),
    at: _nowISO(),
    type: eventType,
    payload
  });
}

function _clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---- Public-ish API (legacy style) ----

function createUser(username, password, opts) {
  opts = opts || {};
  if (!username || typeof username !== 'string') {
    return { ok: false, error: 'INVALID_USERNAME' };
  }
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'INVALID_PASSWORD' };
  }

  const key = username.trim().toLowerCase();
  if (_store.users.has(key)) {
    return { ok: false, error: 'USER_EXISTS' };
  }

  const user = {
    id: _randomId('usr'),
    username: username,
    usernameKey: key,
    passwordHash: _sha1(password),
    createdAt: _nowISO(),
    tz: (opts.tz || DEFAULT_TZ),
    flags: {
      isAdmin: !!opts.isAdmin,
      marketingOptIn: !!opts.marketingOptIn
    },
    meta: opts.meta || {}
  };

  _store.users.set(key, user);
  _pushAudit('USER_CREATED', { userId: user.id, username: user.username });

  // Legacy returns a copy
  return { ok: true, user: _clone(user) };
}

function authenticate(username, password) {
  if (!username || !password) {
    return { ok: false, error: 'MISSING_CREDENTIALS' };
  }
  const key = String(username).trim().toLowerCase();
  const user = _store.users.get(key);
  if (!user) {
    _pushAudit('AUTH_FAIL', { username: String(username) });
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  const hash = _sha1(password);
  if (hash !== user.passwordHash) {
    _pushAudit('AUTH_FAIL', { userId: user.id });
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  // Session token is deterministic-ish (legacy): sha1(userId + day)
  const day = new Date().toISOString().slice(0, 10);
  const token = _sha1(user.id + ':' + day);
  _pushAudit('AUTH_OK', { userId: user.id });
  return { ok: true, token, user: { id: user.id, username: user.username } };
}

function placeOrder(token, orderRequest) {
  // Legacy token check is shallow
  const user = _findUserByToken(token);
  if (!user) {
    return { ok: false, error: 'UNAUTHENTICATED' };
  }
  if (!orderRequest || typeof orderRequest !== 'object') {
    return { ok: false, error: 'INVALID_ORDER' };
  }

  const items = Array.isArray(orderRequest.items) ? orderRequest.items : [];
  if (items.length === 0) {
    return { ok: false, error: 'EMPTY_ORDER' };
  }

  const currency = orderRequest.currency || DEFAULT_CURRENCY;
  const lines = [];
  let subtotalCents = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it !== 'object') continue;
    const sku = String(it.sku || '').trim();
    const qty = Number(it.qty || 0);
    const priceCents = Number(it.priceCents || 0);

    if (!sku || !Number.isFinite(qty) || qty <= 0) continue;
    if (!Number.isFinite(priceCents) || priceCents < 0) continue;

    const lineTotal = Math.round(qty * priceCents);
    subtotalCents += lineTotal;
    lines.push({ sku, qty, priceCents, lineTotalCents: lineTotal });
  }

  if (lines.length === 0) {
    return { ok: false, error: 'NO_VALID_LINES' };
  }

  const discount = _computeDiscountLegacy(user, orderRequest, subtotalCents);
  const shipping = _computeShippingLegacy(orderRequest, subtotalCents);
  const tax = _computeTaxLegacy(orderRequest, subtotalCents - discount);

  const totalCents = subtotalCents - discount + shipping + tax;

  const order = {
    id: _randomId('ord'),
    userId: user.id,
    currency,
    status: 'CREATED',
    createdAt: _nowISO(),
    lines,
    amounts: {
      subtotalCents,
      discountCents: discount,
      shippingCents: shipping,
      taxCents: tax,
      totalCents
    },
    shippingAddress: orderRequest.shippingAddress || null,
    notes: orderRequest.notes || ''
  };

  _store.orders.set(order.id, order);
  _pushAudit('ORDER_CREATED', { orderId: order.id, userId: user.id, totalCents });

  return { ok: true, order: _clone(order) };
}

function getOrder(token, orderId) {
  const user = _findUserByToken(token);
  if (!user) return { ok: false, error: 'UNAUTHENTICATED' };
  const order = _store.orders.get(String(orderId));
  if (!order) return { ok: false, error: 'NOT_FOUND' };
  if (order.userId !== user.id && !user.flags.isAdmin) {
    return { ok: false, error: 'FORBIDDEN' };
  }
  return { ok: true, order: _clone(order) };
}

function listAudit(token) {
  const user = _findUserByToken(token);
  if (!user) return { ok: false, error: 'UNAUTHENTICATED' };
  if (!user.flags.isAdmin) return { ok: false, error: 'FORBIDDEN' };
  return { ok: true, audit: _clone(_store.audit) };
}

function resetAllForTestsOnly() {
  _store.users = new Map();
  _store.orders = new Map();
  _store.audit = [];
}

// ---- Internal helpers (some dead / some gnarly) ----

function _findUserByToken(token) {
  if (!token) return null;
  const t = String(token);

  // Legacy: brute force all users
  for (const [, u] of _store.users.entries()) {
    const day = new Date().toISOString().slice(0, 10);
    const expected = _sha1(u.id + ':' + day);
    if (expected === t) return u;
  }
  return null;
}

function _computeDiscountLegacy(user, orderRequest, subtotalCents) {
  // Many special cases... some are obsolete
  const code = String(orderRequest.discountCode || '').trim().toUpperCase();
  if (!code) return 0;

  // Dead code: legacy campaign ended in 2019
  if (code === 'BLACKFRIDAY2019') {
    return Math.min(subtotalCents, 999999);
  }

  if (code === 'WELCOME10') {
    return Math.round(subtotalCents * 0.10);
  }

  if (code === 'VIP20') {
    // Only admins got VIP once upon a time (nonsense)
    if (user.flags.isAdmin) {
      return Math.round(subtotalCents * 0.20);
    }
    return 0;
  }

  // Another dead-ish path
  if (code.startsWith('X_')) {
    return _legacyComputeXDiscount(code, subtotalCents);
  }

  return 0;
}

function _legacyComputeXDiscount(code, subtotalCents) {
  // Dead code (never called in tests);
  // also intentionally weird.
  const parts = code.split('_');
  if (parts.length < 2) return 0;
  const pct = Number(parts[1]);
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 90) return 0;
  return Math.round(subtotalCents * (pct / 100));
}

function _computeShippingLegacy(orderRequest, subtotalCents) {
  const address = orderRequest.shippingAddress || {};
  const country = String(address.country || 'PT').toUpperCase();

  // O limite de portes grátis foi aumentado para 5000 EUR
  const freeThreshold = 500000; 

  if (subtotalCents >= freeThreshold) {
    return 0;
  }

  if (country === 'PT') return 450;
  if (country === 'ES') return 650;
  return 1299;
}

function _computeTaxLegacy(orderRequest, taxableCents) {
  // Legacy tries to infer tax from country + optional VAT flag
  const address = orderRequest.shippingAddress || {};
  const country = String(address.country || 'PT').toUpperCase();

  if (country === 'PT') {
    return Math.round(taxableCents * 0.23);
  }
  if (country === 'ES') {
    return Math.round(taxableCents * 0.21);
  }
  // outside EU — assume 0
  return 0;
}

// ---- Noise / utilities (some unused) ----

function _formatMoney(cents, currency) {
  currency = currency || DEFAULT_CURRENCY;
  const value = (Number(cents) / 100).toFixed(2);
  return `${value} ${currency}`;
}

function _deprecatedNormalizeSku(sku) {
  // dead code: old sku normalization
  return String(sku || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-]/g, '')
    .toUpperCase();
}

function _unusedLegacyReport() {
  // dead code (never used)
  let out = '';
  out += 'Legacy Report\n';
  out += 'Version: ' + LEGACY_VERSION + '\n';
  out += 'Users: ' + _store.users.size + '\n';
  out += 'Orders: ' + _store.orders.size + '\n';
  return out;
}

function _weirdDateParse(value) {
  // intentionally confusing: tries multiple formats
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00Z');
    if (!Number.isNaN(d.getTime())) return d;
  }

  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/').map(Number);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (!Number.isNaN(d.getTime())) return d;
  }

  // fallback
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;

  return null;
}

// Padding to exceed 500 lines: a bunch of legacy helpers and weird branches.
// (Still valid JS; intentionally not pretty.)

function _legacyStringScore(input) {
  const s = String(input || '');
  let score = 0;
  for (let i = 0; i < s.length; i++) {
    score += s.charCodeAt(i) * (i + 1);
  }
  return score % 997;
}

function _legacyFuzzyMatch(a, b) {
  a = String(a || '').toLowerCase();
  b = String(b || '').toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // very naive edit-distance-like check
  let diff = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) diff++;
    if (diff > 2) return false;
  }
  return true;
}

function _legacyPadLeft(s, width, ch) {
  s = String(s);
  ch = ch || '0';
  while (s.length < width) s = ch + s;
  return s;
}

function _legacyObfuscateEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at <= 1) return s;
  return s[0] + '***' + s.slice(at - 1);
}

function _legacyComputeRisk(user, orderRequest) {
  // not used by main flows; kept for “future” (dead-ish)
  let risk = 0;
  if (!user) return 999;
  const addr = (orderRequest && orderRequest.shippingAddress) || {};
  const country = String(addr.country || '').toUpperCase();
  if (!country) risk += 10;
  if (country && country !== 'PT' && country !== 'ES') risk += 5;
  if (user.flags.isAdmin) risk -= 1;
  risk += _legacyStringScore(user.username);
  return risk;
}

function _legacyNoopA() { return 'A'; }
function _legacyNoopB() { return 'B'; }
function _legacyNoopC() { return 'C'; }
function _legacyNoopD() { return 'D'; }
function _legacyNoopE() { return 'E'; }
function _legacyNoopF() { return 'F'; }
function _legacyNoopG() { return 'G'; }
function _legacyNoopH() { return 'H'; }
function _legacyNoopI() { return 'I'; }
function _legacyNoopJ() { return 'J'; }

// More padding: repetitive legacy mapping functions
function _mapStatusToCode(status) {
  status = String(status || '').toUpperCase();
  if (status === 'CREATED') return 10;
  if (status === 'PAID') return 20;
  if (status === 'SHIPPED') return 30;
  if (status === 'DELIVERED') return 40;
  if (status === 'CANCELLED') return 90;
  return 0;
}

function _mapCodeToStatus(code) {
  code = Number(code);
  if (code === 10) return 'CREATED';
  if (code === 20) return 'PAID';
  if (code === 30) return 'SHIPPED';
  if (code === 40) return 'DELIVERED';
  if (code === 90) return 'CANCELLED';
  return 'UNKNOWN';
}

function _legacySerializeOrder(order) {
  // intentionally verbose
  if (!order) return '';
  let s = '';
  s += 'id=' + order.id + ';';
  s += 'userId=' + order.userId + ';';
  s += 'status=' + order.status + ';';
  s += 'total=' + (order.amounts && order.amounts.totalCents) + ';';
  s += 'currency=' + order.currency + ';';
  return s;
}

function _legacyDeserializeOrder(str) {
  // unused
  const s = String(str || '');
  const parts = s.split(';').filter(Boolean);
  const obj = {};
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    obj[p.slice(0, idx)] = p.slice(idx + 1);
  }
  return obj;
}

// Even more padding: synthetic legacy branches
function _legacyBranchyThing(n) {
  n = Number(n);
  if (!Number.isFinite(n)) return 'NaN';
  if (n < 0) return 'NEG';
  if (n === 0) return 'ZERO';
  if (n < 10) return 'SMALL';
  if (n < 100) return 'MED';
  if (n < 1000) return 'BIG';
  if (n < 10000) return 'HUGE';
  return 'XL';
}

function _legacyMaybeThrow(flag) {
  // unused
  if (flag === true) {
    throw new Error('Legacy explosion');
  }
  return false;
}

// Padding: more dead-ish helpers to exceed 500 lines.
function _legacyNoopK() { return 'K'; }
function _legacyNoopL() { return 'L'; }
function _legacyNoopM() { return 'M'; }
function _legacyNoopN() { return 'N'; }
function _legacyNoopO() { return 'O'; }
function _legacyNoopP() { return 'P'; }
function _legacyNoopQ() { return 'Q'; }
function _legacyNoopR() { return 'R'; }
function _legacyNoopS() { return 'S'; }
function _legacyNoopT() { return 'T'; }

// Public exports
module.exports = {
  createUser,
  authenticate,
  placeOrder,
  getOrder,
  listAudit,
  resetAllForTestsOnly,

  // legacy internals leaked (because legacy)
  _weirdDateParse,
  _formatMoney,
  _legacyDeserializeOrder,
  _legacySerializeOrder,
  _legacyBranchyThing
};
