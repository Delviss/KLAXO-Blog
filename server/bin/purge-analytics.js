#!/usr/bin/env node
'use strict';

/**
 * Analytics data-retention job (#20/#22). Deletes events older than N days.
 * Run on a schedule (Railway cron): `node bin/purge-analytics.js 400`
 * Default retention: 400 days.
 */

const { pool } = require('../src/db/pool');
const Analytics = require('../src/db/analytics');

const days = parseInt(process.argv[2] || process.env.ANALYTICS_RETENTION_DAYS || '400', 10);

Analytics.purgeOlderThan(days)
  .then((n) => console.log(`Purged ${n} analytics events older than ${days} days.`))
  .catch((err) => {
    console.error('purge-analytics failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
