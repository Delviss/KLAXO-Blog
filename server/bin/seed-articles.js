#!/usr/bin/env node
'use strict';

/**
 * Content migration (#22): import the existing hand-written articles from the
 * repo root into the `articles` table so they are managed by the CMS.
 *
 *   npm run seed:articles            # import as published
 *   npm run seed:articles -- --draft # import as drafts
 *
 * Idempotent: re-running upserts by slug. It does NOT re-commit anything to
 * GitHub — run a publish from the dashboard (or the pipeline) to regenerate.
 */

const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/db/pool');
const { sanitizeBody, toPlainText } = require('../src/services/sanitize');
const { readTimeMinutes } = require('../src/services/readTime');

const ROOT = path.join(__dirname, '..', '..');
const asDraft = process.argv.includes('--draft');

// slug -> known metadata (published dates preserved from the live pages).
const ARTICLES = [
  { slug: 'coastal-drives', category: 'Coastal Drives', date: '2024-10-12' },
  { slug: 'day-trips-from-munich', category: 'Day Trips', date: '2026-05-02' },
  { slug: 'alpine-transfers', category: 'Alpine Transfers', date: '2026-04-18' },
  { slug: 'v-class-group-travel', category: 'Group Travel', date: '2026-03-21' },
  { slug: 'sustainable-mobility', category: 'Sustainable Mobility', date: '2026-02-09' },
];

function decode(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, '·').trim();
}

function match(re, html, group = 1) {
  const m = html.match(re);
  return m ? m[group] : null;
}

function extract(slug, html) {
  const titleRaw = match(/<title>\s*Klaxo Travel Tips\s*-\s*([\s\S]*?)<\/title>/i, html) || slug;
  const title = decode(titleRaw);
  const description = decode(match(/name="description"\s+content="([^"]*)"/i, html) || '');
  const category = decode(
    match(/bg-primary-container text-white px-3 py-1 text-label-bold font-label-bold uppercase mb-3[^>]*>\s*([^<]+?)\s*</i, html) || ''
  );
  const heroImg = match(/<img class="w-full h-full object-cover"[^>]*\ssrc="([^"]+)"/i, html);
  const heroAlt = decode(match(/<img class="w-full h-full object-cover"[^>]*\sdata-alt="([^"]+)"/i, html) || '');
  const readTime = parseInt(match(/(\d+)\s*Min Read/i, html) || '0', 10);

  // Body = the prose block, up to the Author Bio marker.
  let body = '';
  const start = html.indexOf('<div class="prose max-w-none">');
  if (start !== -1) {
    const after = html.indexOf('<!-- Author Bio -->', start);
    let chunk = html.slice(start + '<div class="prose max-w-none">'.length, after === -1 ? undefined : after);
    // Trim the trailing closing </div> of the prose wrapper.
    chunk = chunk.replace(/\s*<\/div>\s*$/, '');
    body = chunk.trim();
  }
  return { title, description, category, heroImg, heroAlt, readTime, body };
}

async function upsert(meta) {
  const file = path.join(ROOT, `${meta.slug}.html`);
  if (!fs.existsSync(file)) {
    console.warn(`- skip ${meta.slug} (file not found)`);
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  const x = extract(meta.slug, html);
  const body_html = sanitizeBody(x.body);
  const excerpt = (x.description || toPlainText(body_html)).slice(0, 200);
  const status = asDraft ? 'draft' : 'published';
  const publishedAt = asDraft ? null : new Date(`${meta.date}T09:00:00Z`).toISOString();

  await query(
    `INSERT INTO articles
       (slug, title, excerpt, category, hero_image_url, hero_image_alt, body_html,
        author_name, read_time_minutes, status, seo_title, seo_description, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, category = EXCLUDED.category,
       hero_image_url = EXCLUDED.hero_image_url, hero_image_alt = EXCLUDED.hero_image_alt,
       body_html = EXCLUDED.body_html, read_time_minutes = EXCLUDED.read_time_minutes,
       status = EXCLUDED.status, seo_title = EXCLUDED.seo_title,
       seo_description = EXCLUDED.seo_description,
       published_at = COALESCE(articles.published_at, EXCLUDED.published_at)`,
    [
      meta.slug,
      x.title,
      excerpt,
      // Prefer the curated category; some hero badges use a generic label.
      meta.category || x.category,
      x.heroImg || '',
      x.heroAlt || '',
      body_html,
      'Daniel (Klaxo Team)',
      x.readTime || readTimeMinutes(body_html),
      status,
      // seo_title holds only the headline; renderArticle adds the "Klaxo
      // Travel Tips - " site prefix, so don't duplicate it here.
      null,
      x.description || excerpt,
      publishedAt,
    ]
  );
  console.log(`✔ ${status.padEnd(9)} ${meta.slug}  "${x.title}" (${x.readTime || '?'} min, ${(x.body || '').length} chars body)`);
}

async function main() {
  console.log(`Importing ${ARTICLES.length} articles as ${asDraft ? 'drafts' : 'published'}…`);
  for (const a of ARTICLES) {
    // eslint-disable-next-line no-await-in-loop
    await upsert(a);
  }
  console.log('Done. Publish from the dashboard to regenerate index.html + article pages.');
}

main()
  .catch((err) => {
    console.error('seed:articles failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
