'use strict';

const { Pool } = require('pg');
const { config } = require('../config');

/**
 * Shared Postgres connection pool. Railway injects DATABASE_URL; managed
 * Postgres usually needs SSL (DATABASE_SSL=true).
 */
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // A pooled client errored while idle — log, don't crash the process.
  console.error('[db] unexpected idle client error', err.message);
});

/** Thin query helper. */
function query(text, params) {
  return pool.query(text, params);
}

/** Run a function inside a transaction, auto commit/rollback. */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore rollback failure */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Liveness check used by /health. */
async function ping() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0] && rows[0].ok === 1;
}

module.exports = { pool, query, withTransaction, ping };
