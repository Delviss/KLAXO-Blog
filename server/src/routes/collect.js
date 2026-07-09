'use strict';

const crypto = require('crypto');
const express = require('express');
const { config } = require('../config');
const { parseUA } = require('../services/ua');
const Analytics = require('../db/analytics');
const { collectLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/* ---- CORS restricted to the blog origin(s) (#20) ------------------------ */
function cors(req, res, next) {
  const origin = req.get('origin');
  const allowed = config.allowedOrigins;
  const ok = allowed.length === 0 || (origin && allowed.includes(origin));
  if (ok && origin) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!ok) return res.status(403).json({ error: 'origin_not_allowed' });
  next();
}
router.use(cors);
router.use(collectLimiter);
// navigator.sendBeacon delivers text/plain to avoid a CORS preflight; parse it
// as a raw string here (the global JSON parser handles the application/json case).
router.use(express.text({ type: ['text/plain'], limit: '16kb' }));

/* ---- Privacy-friendly daily visitor hash (no raw IP stored) ------------- */
function visitorHash(ip, ua) {
  const day = new Date().toISOString().slice(0, 10); // rotates daily (UTC)
  return crypto
    .createHash('sha256')
    .update(`${config.analyticsSalt}|${day}|${ip}|${ua}`)
    .digest('hex')
    .slice(0, 32);
}

function clean(str, max = 512) {
  if (str == null) return null;
  const s = String(str).trim();
  return s ? s.slice(0, max) : null;
}

const EVENT_TYPES = new Set(['pageview', 'click', 'custom']);

/** POST /api/collect — store a pageview/click beacon. Always 204 (fire-and-forget). */
router.post('/', async (req, res) => {
  try {
    const ua = req.get('user-agent') || '';
    const parsed = parseUA(ua);
    if (parsed.bot) return res.status(204).end(); // silently drop bots

    // sendBeacon delivers text/plain; parse JSON body ourselves if needed.
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body && typeof body === 'object' ? body : {};

    const eventType = EVENT_TYPES.has(body.event_type) ? body.event_type : 'pageview';
    const ip = req.ip || '';
    const country = clean(req.get('cf-ipcountry') || req.get('x-country') || null, 2);

    const event = {
      event_type: eventType,
      path: clean(body.path, 512) || '/',
      article_slug: clean(body.slug || body.article_slug, 200),
      referrer: clean(body.referrer, 1000),
      utm_source: clean(body.utm_source, 200),
      utm_medium: clean(body.utm_medium, 200),
      utm_campaign: clean(body.utm_campaign, 200),
      visitor_hash: visitorHash(ip, ua),
      session_id: clean(body.session_id, 64),
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      country: country ? country.toUpperCase() : null,
      meta: sanitizeMeta(body.meta, eventType),
    };

    await Analytics.insertEvent(event);
    res.status(204).end();
  } catch (err) {
    // Never break the page over analytics; log and 204.
    console.error('[collect] error', err.message);
    res.status(204).end();
  }
});

/** Keep only small, known click metadata (target/label/href). */
function sanitizeMeta(meta, eventType) {
  if (eventType !== 'click' || !meta || typeof meta !== 'object') return null;
  const out = {};
  if (meta.target) out.target = String(meta.target).slice(0, 120);
  if (meta.label) out.label = String(meta.label).slice(0, 120);
  if (meta.href) out.href = String(meta.href).slice(0, 500);
  return Object.keys(out).length ? out : null;
}

module.exports = router;
