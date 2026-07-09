'use strict';

const { query } = require('./pool');

/** Insert a validated analytics event (#20). */
async function insertEvent(e) {
  await query(
    `INSERT INTO analytics_events
      (event_type, path, article_slug, referrer, utm_source, utm_medium, utm_campaign,
       visitor_hash, session_id, device, browser, os, country, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      e.event_type,
      e.path,
      e.article_slug || null,
      e.referrer || null,
      e.utm_source || null,
      e.utm_medium || null,
      e.utm_campaign || null,
      e.visitor_hash || null,
      e.session_id || null,
      e.device || null,
      e.browser || null,
      e.os || null,
      e.country || null,
      e.meta ? JSON.stringify(e.meta) : null,
    ]
  );
}

/* ----------------------------------------------------------------------- */
/* Aggregations for the analytics dashboard (#21). All take {from, to}      */
/* ISO date bounds (inclusive from, exclusive to).                          */
/* ----------------------------------------------------------------------- */

async function overview({ from, to }) {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE event_type = 'pageview')::int          AS pageviews,
       COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'pageview')::int AS visitors,
       COUNT(*) FILTER (WHERE event_type = 'click')::int             AS clicks,
       COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'pageview')::int   AS sessions
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2`,
    [from, to]
  );
  return rows[0];
}

async function timeSeries({ from, to }) {
  const { rows } = await query(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE event_type = 'pageview')::int AS pageviews,
            COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'pageview')::int AS visitors
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2
     GROUP BY 1 ORDER BY 1`,
    [from, to]
  );
  return rows;
}

async function topArticles({ from, to, limit = 10 }) {
  const { rows } = await query(
    `SELECT COALESCE(article_slug, path) AS slug,
            COUNT(*) FILTER (WHERE event_type = 'pageview')::int AS pageviews,
            COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'pageview')::int AS visitors
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2 AND event_type = 'pageview'
     GROUP BY 1 ORDER BY pageviews DESC LIMIT $3`,
    [from, to, limit]
  );
  return rows;
}

async function trafficSources({ from, to, limit = 10 }) {
  const { rows } = await query(
    `SELECT
       CASE
         WHEN utm_source IS NOT NULL THEN 'campaign: ' || utm_source
         WHEN referrer IS NULL OR referrer = '' THEN 'direct'
         ELSE regexp_replace(referrer, '^https?://([^/]+).*$', '\\1')
       END AS source,
       COUNT(*)::int AS pageviews
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2 AND event_type = 'pageview'
     GROUP BY 1 ORDER BY pageviews DESC LIMIT $3`,
    [from, to, limit]
  );
  return rows;
}

async function breakdown(column, { from, to, limit = 10 }) {
  const allowed = ['device', 'browser', 'os', 'country'];
  if (!allowed.includes(column)) throw new Error('invalid breakdown column');
  const { rows } = await query(
    `SELECT COALESCE(${column}, 'Unknown') AS label, COUNT(*)::int AS pageviews
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2 AND event_type = 'pageview'
     GROUP BY 1 ORDER BY pageviews DESC LIMIT $3`,
    [from, to, limit]
  );
  return rows;
}

async function topClicks({ from, to, limit = 15 }) {
  const { rows } = await query(
    `SELECT COALESCE(meta->>'target', meta->>'label', 'unlabeled') AS target,
            COUNT(*)::int AS clicks
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2 AND event_type = 'click'
     GROUP BY 1 ORDER BY clicks DESC LIMIT $3`,
    [from, to, limit]
  );
  return rows;
}

/** Raw rows for CSV export. */
async function exportRows({ from, to, limit = 50000 }) {
  const { rows } = await query(
    `SELECT created_at, event_type, path, article_slug, referrer,
            utm_source, utm_medium, utm_campaign, device, browser, os, country,
            meta->>'target' AS click_target
     FROM analytics_events
     WHERE created_at >= $1 AND created_at < $2
     ORDER BY created_at DESC LIMIT $3`,
    [from, to, limit]
  );
  return rows;
}

/** Delete events older than N days (retention policy #20). */
async function purgeOlderThan(days) {
  const { rowCount } = await query(
    `DELETE FROM analytics_events WHERE created_at < now() - ($1 || ' days')::interval`,
    [String(days)]
  );
  return rowCount;
}

module.exports = {
  insertEvent,
  overview,
  timeSeries,
  topArticles,
  trafficSources,
  breakdown,
  topClicks,
  exportRows,
  purgeOlderThan,
};
