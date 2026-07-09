'use strict';

const crypto = require('crypto');

/**
 * Lightweight session-backed CSRF protection (#16).
 *
 * csurf is deprecated, so we implement the standard synchroniser-token
 * pattern directly: a random token is stored in the session and must be
 * echoed back on every state-changing request via the `x-csrf-token`
 * header (AJAX) or a `_csrf` form field.
 */

function ensureToken(req) {
  if (!req.session) return null;
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfProtection(req, res, next) {
  const token = ensureToken(req);
  if (SAFE_METHODS.has(req.method)) return next();

  const provided =
    req.get('x-csrf-token') ||
    (req.body && req.body._csrf) ||
    req.query._csrf ||
    '';

  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(token || ''));
  if (!token || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const err = new Error('invalid csrf token');
    err.code = 'EBADCSRFTOKEN';
    return next(err);
  }
  return next();
}

function exposeCsrfToken(req, res, next) {
  res.locals.csrfToken = ensureToken(req);
  next();
}

module.exports = { csrfProtection, exposeCsrfToken };
