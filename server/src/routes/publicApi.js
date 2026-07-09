'use strict';

const express = require('express');
const Articles = require('../db/articles');
const { config } = require('../config');

const router = express.Router();

/** Public-facing article shape — no internal publish/debug fields. */
function publicShape(a) {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    hero_image_url: a.hero_image_url,
    hero_image_alt: a.hero_image_alt,
    author_name: a.author_name,
    read_time_minutes: a.read_time_minutes,
    published_at: a.published_at,
    url: `${config.github.siteBaseUrl}/${a.slug}.html`,
  };
}

// Allow the static site (any origin) to read published metadata.
router.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cache-Control', 'public, max-age=60');
  next();
});

/** GET /api/articles — published list (metadata only). */
router.get('/articles', async (_req, res, next) => {
  try {
    const rows = await Articles.listPublished();
    res.json({ articles: rows.map(publicShape) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/articles/:slug — a single published article (with body). */
router.get('/articles/:slug', async (req, res, next) => {
  try {
    const a = await Articles.getBySlug(req.params.slug);
    if (!a || a.status !== 'published') return res.status(404).json({ error: 'not_found' });
    res.json({ article: { ...publicShape(a), body_html: a.body_html } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
