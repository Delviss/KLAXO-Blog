'use strict';

/**
 * Session-based auth helpers (#16).
 *
 * attachUser  — makes req.user / res.locals.user available on every request.
 * requireAuth — gates a route. HTML requests redirect to /admin/login,
 *               API requests get a 401 JSON body.
 */

function attachUser(req, res, next) {
  req.user = (req.session && req.session.user) || null;
  res.locals.user = req.user;
  res.locals.currentPath = req.path;
  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  const wantsJson =
    req.path.startsWith('/admin/api') ||
    (req.get('accept') || '').includes('application/json') ||
    req.xhr;
  if (wantsJson) return res.status(401).json({ error: 'unauthenticated' });
  const back = encodeURIComponent(req.originalUrl);
  return res.redirect(`/admin/login?next=${back}`);
}

module.exports = { attachUser, requireAuth };
