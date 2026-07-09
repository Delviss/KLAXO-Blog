'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const Users = require('../db/users');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/** Login page. If already signed in, go to the dashboard. */
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('login', {
    title: 'Sign in',
    error: null,
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
});

/** Handle credentials. Generic errors to avoid user enumeration. */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const nextUrl = safeNext(req.body.next);

    const fail = () =>
      res.status(401).render('login', {
        title: 'Sign in',
        error: 'Invalid email or password.',
        next: nextUrl,
      });

    if (!email || !password) return fail();

    const user = await Users.findByEmail(email);
    if (!user) {
      await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv'); // constant-time-ish
      return fail();
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return fail();

    // Prevent session fixation: regenerate session on privilege change.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, email: user.email, role: user.role };
      Users.updateLastLogin(user.id).catch(() => {});
      req.session.save(() => res.redirect(nextUrl || '/admin'));
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('klaxo.sid');
    res.redirect('/admin/login');
  });
});

/** Only allow same-origin relative paths as post-login redirect targets. */
function safeNext(value) {
  const v = String(value || '');
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  return '';
}

module.exports = router;
