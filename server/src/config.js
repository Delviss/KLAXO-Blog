'use strict';

/**
 * Centralised, validated configuration. Everything is read from the
 * environment (see .env.example). Import this module instead of touching
 * process.env directly so config is validated in one place.
 */

require('dotenv').config();

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function list(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

const config = {
  nodeEnv: NODE_ENV,
  isProd,
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,

  database: {
    url: process.env.DATABASE_URL,
    ssl: bool(process.env.DATABASE_SSL, false),
  },

  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-session-secret',
  analyticsSalt: process.env.ANALYTICS_SALT || 'dev-insecure-analytics-salt',

  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || 'Delviss',
    repo: process.env.GITHUB_REPO || 'KLAXO-Blog',
    branch: process.env.GITHUB_BRANCH || 'main',
    siteBaseUrl: (process.env.SITE_BASE_URL || 'https://blog.klaxo.eu').replace(/\/$/, ''),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },

  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
};

/**
 * Throw early in production if required secrets are missing/insecure.
 * In development we allow the insecure fallbacks so the app boots for a demo.
 */
function assertProdConfig() {
  if (!config.isProd) return;
  const problems = [];
  if (!config.database.url) problems.push('DATABASE_URL is required');
  if (!process.env.SESSION_SECRET || config.sessionSecret === 'dev-insecure-session-secret') {
    problems.push('SESSION_SECRET must be set to a strong random value');
  }
  if (!process.env.ANALYTICS_SALT || config.analyticsSalt === 'dev-insecure-analytics-salt') {
    problems.push('ANALYTICS_SALT must be set to a strong random value');
  }
  if (problems.length) {
    throw new Error('Invalid production configuration:\n  - ' + problems.join('\n  - '));
  }
}

module.exports = { config, assertProdConfig, bool, list };
