'use strict';

const { createApp } = require('./app');
const { config, assertProdConfig } = require('./config');
const { pool } = require('./db/pool');

assertProdConfig();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[klaxo-blog] listening on :${config.port} (${config.nodeEnv})`);
  console.log(`[klaxo-blog] health:   ${config.appUrl}/health`);
  console.log(`[klaxo-blog] admin:    ${config.appUrl}/admin`);
});

// Graceful shutdown so Railway deploys/restarts drain cleanly.
function shutdown(signal) {
  console.log(`[klaxo-blog] ${signal} received, shutting down…`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  // Hard exit if something hangs.
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
