'use strict';

const rateLimit = require('express-rate-limit');

/** Login throttle — blunts credential-stuffing (#16). */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

/** General admin API limiter. */
const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Public analytics collector limiter — generous but abuse-resistant (#20). */
const collectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited' },
});

module.exports = { loginLimiter, adminApiLimiter, collectLimiter };
