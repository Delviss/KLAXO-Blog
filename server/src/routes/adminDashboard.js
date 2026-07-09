'use strict';

const express = require('express');
const Articles = require('../db/articles');
const Analytics = require('../db/analytics');
const { previewArticle } = require('../services/publish');
const { config } = require('../config');

const router = express.Router();

/** GET /admin — dashboard overview. */
router.get('/', async (req, res, next) => {
  try {
    const all = await Articles.list({});
    const drafts = all.filter((a) => a.status === 'draft');
    const published = all.filter((a) => a.status === 'published');
    const failed = all.filter((a) => a.publish_state === 'publish_failed');

    // Last-7d snapshot for the header tiles.
    const now = new Date();
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 7);
    let overview = { pageviews: 0, visitors: 0, clicks: 0 };
    try {
      overview = await Analytics.overview({ from, to });
    } catch (_) {
      /* analytics table may be empty; ignore */
    }

    res.render('dashboard', {
      title: 'Dashboard',
      counts: { total: all.length, drafts: drafts.length, published: published.length, failed: failed.length },
      overview,
      recent: all.slice(0, 6),
      githubConfigured: Boolean(config.github.token),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/articles — list view. */
router.get('/articles', async (req, res, next) => {
  try {
    const status = ['draft', 'published'].includes(req.query.status) ? req.query.status : undefined;
    const articles = await Articles.list({ status });
    res.render('articles-list', {
      title: 'Articles',
      articles,
      filter: status || 'all',
      siteBaseUrl: config.github.siteBaseUrl,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/articles/new — editor (blank). */
router.get('/articles/new', (req, res) => {
  res.render('article-edit', { title: 'New article', article: null });
});

/** GET /admin/articles/:id/edit — editor (loaded). */
router.get('/articles/:id/edit', async (req, res, next) => {
  try {
    const article = await Articles.getById(req.params.id);
    if (!article) return res.status(404).send('Article not found');
    res.render('article-edit', { title: `Edit: ${article.title}`, article });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/articles/:id/preview — rendered HTML for the preview iframe. */
router.get('/articles/:id/preview', async (req, res, next) => {
  try {
    const article = await Articles.getById(req.params.id);
    if (!article) return res.status(404).send('Not found');
    const published = await Articles.listPublished();
    res.type('html').send(previewArticle(article, published));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
