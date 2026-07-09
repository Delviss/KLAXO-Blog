'use strict';

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { config } = require('./config');
const { pool, ping } = require('./db/pool');
const { securityHeaders } = require('./middleware/security');
const { attachUser, requireAuth } = require('./middleware/auth');
const { csrfProtection, exposeCsrfToken } = require('./middleware/csrf');

const authRoutes = require('./routes/auth');
const adminArticleApiRoutes = require('./routes/adminArticles');
const adminMediaRoutes = require('./routes/adminMedia');
const adminDashboardRoutes = require('./routes/adminDashboard');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const publicApiRoutes = require('./routes/publicApi');
const collectRoutes = require('./routes/collect');

/**
 * Build the Express application. Exported as a factory so tests can create an
 * app without starting a listener.
 */
function createApp() {
  const app = express();

  // Behind Railway's proxy — required for secure cookies + correct req.ip.
  app.set('trust proxy', 1);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Security headers (helmet), configured for our CDN-driven pages.
  app.use(securityHeaders());

  // Body parsers. The collector accepts small JSON beacons.
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(cookieParser());

  // Static assets for the dashboard + the public tracking snippet.
  app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));
  // Serve uploaded media from a durable location (Railway volume in prod).
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));

  // ---- Health check (#15) — no auth, no session ---------------------------
  app.get('/health', async (_req, res) => {
    try {
      const ok = await ping();
      res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', db: ok ? 'connected' : 'down' });
    } catch (err) {
      res.status(503).json({ status: 'degraded', db: 'down', error: err.message });
    }
  });

  // ---- Public analytics collector (#20) — CORS, no session/CSRF -----------
  app.use('/api/collect', collectRoutes);

  // ---- Public read API (#17) ---------------------------------------------
  app.use('/api', publicApiRoutes);

  // ---- Sessions (needed for auth + admin below) ---------------------------
  app.use(
    session({
      store: new pgSession({ pool, tableName: 'session', createTableIfMissing: false }),
      name: 'klaxo.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: config.isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8, // 8h
      },
    })
  );
  app.use(attachUser);

  // Auth routes (public login/logout). Login form needs a CSRF token.
  app.use('/admin', csrfProtection, exposeCsrfToken, authRoutes);

  // Protected admin surface. Specific paths first, dashboard catch-all last.
  app.use('/admin/api/articles', csrfProtection, requireAuth, adminArticleApiRoutes);
  app.use('/admin/api/media', csrfProtection, requireAuth, adminMediaRoutes);
  app.use('/admin/analytics', csrfProtection, exposeCsrfToken, requireAuth, adminAnalyticsRoutes);
  app.use('/admin', csrfProtection, exposeCsrfToken, requireAuth, adminDashboardRoutes);

  // Root → dashboard.
  app.get('/', (_req, res) => res.redirect('/admin'));

  // 404
  app.use((req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin/api')) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.status(404).send('Not found');
  });

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ error: 'invalid_csrf_token' });
    }
    console.error('[error]', err && err.stack ? err.stack : err);
    const wantsJson = req.path.startsWith('/api') || req.path.startsWith('/admin/api');
    if (wantsJson) return res.status(500).json({ error: 'internal_error' });
    res.status(500).send('Something went wrong.');
  });

  return app;
}

module.exports = { createApp };
