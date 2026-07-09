'use strict';

const express = require('express');
const Analytics = require('../db/analytics');

const router = express.Router();

/** Resolve a range preset / custom dates to [from, to) Date objects. */
function resolveRange(query) {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  let from;
  const preset = query.range || '7d';

  if (query.from && query.to) {
    from = new Date(`${query.from}T00:00:00Z`);
    const t = new Date(`${query.to}T00:00:00Z`);
    t.setUTCDate(t.getUTCDate() + 1);
    return { from, to: t, preset: 'custom', fromStr: query.from, toStr: query.to };
  }

  const map = { today: 1, '7d': 7, '30d': 30, '90d': 90 };
  const days = map[preset] || 7;
  from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);
  return {
    from,
    to,
    preset,
    fromStr: from.toISOString().slice(0, 10),
    toStr: now.toISOString().slice(0, 10),
  };
}

/** Compute previous comparable period for trend deltas. */
function previousRange({ from, to }) {
  const span = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - span), to: new Date(from.getTime()) };
}

async function gather(range) {
  const [ov, series, top, sources, devices, browsers, os, countries, clicks] = await Promise.all([
    Analytics.overview(range),
    Analytics.timeSeries(range),
    Analytics.topArticles(range),
    Analytics.trafficSources(range),
    Analytics.breakdown('device', range),
    Analytics.breakdown('browser', range),
    Analytics.breakdown('os', range),
    Analytics.breakdown('country', range),
    Analytics.topClicks(range),
  ]);
  const prev = await Analytics.overview(previousRange(range));
  return { overview: ov, previous: prev, series, top, sources, devices, browsers, os, countries, clicks };
}

/** GET /admin/analytics — the dashboard page. */
router.get('/', async (req, res, next) => {
  try {
    const range = resolveRange(req.query);
    const data = await gather(range);
    res.render('analytics', { title: 'Analytics', range, data });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/analytics/data — JSON (for async range switching / charts). */
router.get('/data', async (req, res, next) => {
  try {
    const range = resolveRange(req.query);
    const data = await gather(range);
    res.json({ range: { from: range.fromStr, to: range.toStr, preset: range.preset }, ...data });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/analytics/export.csv — raw events for the selected range. */
router.get('/export.csv', async (req, res, next) => {
  try {
    const range = resolveRange(req.query);
    const rows = await Analytics.exportRows(range);
    const cols = ['created_at', 'event_type', 'path', 'article_slug', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'device', 'browser', 'os', 'country', 'click_target'];
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [cols.join(',')]
      .concat(rows.map((r) => cols.map((c) => esc(r[c])).join(',')))
      .join('\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="klaxo-analytics-${range.fromStr}_${range.toStr}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
