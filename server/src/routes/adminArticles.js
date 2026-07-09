'use strict';

const express = require('express');
const Articles = require('../db/articles');
const { slugify, uniqueSlug } = require('../services/slug');
const { readTimeMinutes } = require('../services/readTime');
const { sanitizeBody, toPlainText } = require('../services/sanitize');
const { doPublish, doUnpublish, doDelete } = require('../services/publishFlow');
const { previewArticle } = require('../services/publish');
const { adminApiLimiter } = require('../middleware/rateLimit');

const router = express.Router();
router.use(adminApiLimiter);

/** Validate + normalise an incoming article payload. */
function normalizePayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  const has = (k) => body[k] !== undefined && body[k] !== null;

  if (!partial || has('title')) {
    const title = String(body.title || '').trim();
    if (!title) errors.push('title is required');
    else if (title.length > 200) errors.push('title too long (max 200)');
    out.title = title;
  }
  if (has('category')) out.category = String(body.category).trim().slice(0, 80) || 'Field Notes';
  if (has('excerpt')) out.excerpt = String(body.excerpt).trim().slice(0, 400);
  if (has('hero_image_url')) out.hero_image_url = String(body.hero_image_url).trim().slice(0, 1000);
  if (has('hero_image_alt')) out.hero_image_alt = String(body.hero_image_alt).trim().slice(0, 500);
  if (has('author_name')) out.author_name = String(body.author_name).trim().slice(0, 120) || 'Daniel (Klaxo Team)';
  if (has('seo_title')) out.seo_title = String(body.seo_title).trim().slice(0, 200) || null;
  if (has('seo_description')) out.seo_description = String(body.seo_description).trim().slice(0, 320) || null;

  if (has('body_html')) {
    out.body_html = sanitizeBody(body.body_html);
    // Auto read-time unless an explicit override is supplied.
    out.read_time_minutes = has('read_time_minutes') && Number(body.read_time_minutes) > 0
      ? Math.min(120, Math.round(Number(body.read_time_minutes)))
      : readTimeMinutes(out.body_html);
    // Auto excerpt fallback.
    if (!out.excerpt && !partial) out.excerpt = toPlainText(out.body_html).slice(0, 200);
  } else if (has('read_time_minutes')) {
    out.read_time_minutes = Math.min(120, Math.max(1, Math.round(Number(body.read_time_minutes))));
  }

  if (has('body_json')) out.body_json = body.body_json;

  return { out, errors };
}

/** GET /admin/api/articles?status=draft|published */
router.get('/', async (req, res, next) => {
  try {
    const status = ['draft', 'published'].includes(req.query.status) ? req.query.status : undefined;
    const rows = await Articles.list({ status });
    res.json({ articles: rows });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/api/articles/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const a = await Articles.getById(req.params.id);
    if (!a) return res.status(404).json({ error: 'not_found' });
    res.json({ article: a });
  } catch (err) {
    next(err);
  }
});

/** POST /admin/api/articles — create a draft. */
router.post('/', async (req, res, next) => {
  try {
    const { out, errors } = normalizePayload(req.body, { partial: false });
    if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });

    const base = (req.body.slug && slugify(req.body.slug)) || slugify(out.title);
    out.slug = await uniqueSlug(base, Articles.slugExists);
    out.status = 'draft';

    const created = await Articles.create(out);
    res.status(201).json({ article: created });
  } catch (err) {
    next(err);
  }
});

/** PUT /admin/api/articles/:id — update; auto re-publishes if already live. */
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await Articles.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const { out, errors } = normalizePayload(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });

    // Allow explicit slug change (kept unique).
    if (req.body.slug !== undefined) {
      out.slug = await uniqueSlug(slugify(req.body.slug), Articles.slugExists, existing.id);
    }

    let updated = await Articles.update(existing.id, out);

    // If it was published, re-render + re-commit so the live site reflects edits.
    if (existing.status === 'published' && req.body.republish !== false) {
      try {
        const result = await doPublish(existing.id);
        updated = result.article;
        return res.json({ article: updated, republished: true, commit: result.commit });
      } catch (pubErr) {
        return res.status(502).json({ article: updated, error: 'publish_failed', message: pubErr.message });
      }
    }

    res.json({ article: updated });
  } catch (err) {
    next(err);
  }
});

/** POST /admin/api/articles/:id/publish */
router.post('/:id/publish', async (req, res, next) => {
  try {
    const result = await doPublish(req.params.id);
    res.json({ article: result.article, commit: result.commit, url: result.url });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'not_found' });
    res.status(502).json({ error: 'publish_failed', message: err.message });
  }
});

/** POST /admin/api/articles/:id/unpublish */
router.post('/:id/unpublish', async (req, res, next) => {
  try {
    const result = await doUnpublish(req.params.id);
    res.json({ article: result.article, commit: result.commit });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'not_found' });
    res.status(502).json({ error: 'publish_failed', message: err.message });
  }
});

/** DELETE /admin/api/articles/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await doDelete(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'not_found' });
    res.status(502).json({ error: 'delete_failed', message: err.message });
  }
});

/**
 * POST /admin/api/articles/preview — render the given (unsaved) payload to
 * full article HTML for the live preview iframe. Does not persist.
 */
router.post('/preview', async (req, res, next) => {
  try {
    const { out } = normalizePayload(req.body, { partial: false });
    const draft = {
      slug: req.body.slug ? slugify(req.body.slug) : slugify(out.title || 'preview'),
      title: out.title || 'Untitled',
      category: out.category || 'Field Notes',
      excerpt: out.excerpt || '',
      hero_image_url: out.hero_image_url || '',
      hero_image_alt: out.hero_image_alt || '',
      body_html: out.body_html || '',
      author_name: out.author_name || 'Daniel (Klaxo Team)',
      read_time_minutes: out.read_time_minutes || 5,
      seo_title: out.seo_title,
      seo_description: out.seo_description,
      created_at: new Date().toISOString(),
    };
    const published = await Articles.listPublished();
    const html = previewArticle(draft, published);
    res.type('html').send(html);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
