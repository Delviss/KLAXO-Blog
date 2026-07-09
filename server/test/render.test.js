'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { renderArticle } = require('../src/services/renderArticle');
const { renderHome } = require('../src/services/renderHome');
const { renderSitemap } = require('../src/services/sitemap');
const { pickRelated } = require('../src/services/publish');

const sample = {
  slug: 'coastal-drives',
  title: 'Top 5 Hidden Coastal Drives in Bavaria',
  category: 'Coastal Drives',
  excerpt: 'Lakeside routes that rival the Mediterranean.',
  hero_image_url: 'https://example.com/hero.jpg',
  hero_image_alt: 'A lakeside drive at sunset',
  body_html: '<h2>Intro</h2><p>Some body text with <strong>emphasis</strong>.</p>',
  author_name: 'Daniel (Klaxo Team)',
  read_time_minutes: 12,
  published_at: '2024-10-12T09:00:00Z',
  seo_description: 'Five lakeside drives across Bavaria.',
};

const related = [
  { slug: 'alpine-transfers', title: 'Alpine Transfers', category: 'Alpine Transfers', excerpt: 'Munich to the Alps.', hero_image_url: 'https://example.com/a.jpg', hero_image_alt: 'Alps' },
];

test('renderArticle: produces a full, escaped, self-contained page', () => {
  const html = renderArticle(sample, { related, analyticsOrigin: 'https://api.klaxo.eu', siteBaseUrl: 'https://blog.klaxo.eu' });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>Klaxo Travel Tips - Top 5 Hidden Coastal Drives in Bavaria</title>'));
  assert.ok(html.includes('October 12, 2024'));
  assert.ok(html.includes('12 Min Read'));
  assert.ok(html.includes('<h2>Intro</h2>')); // body embedded
  assert.ok(html.includes('href="alpine-transfers.html"')); // related link
  assert.ok(html.includes('js/animations.js'));
  assert.ok(html.includes('data-klaxo-endpoint="https://api.klaxo.eu/api/collect"'));
  assert.ok(html.includes('rel="canonical" href="https://blog.klaxo.eu/coastal-drives.html"'));
  assert.ok(html.trim().endsWith('</html>'));
});

test('renderArticle: escapes hostile title/alt into attributes & text', () => {
  const evil = Object.assign({}, sample, { title: '"><script>alert(1)</script>', hero_image_alt: 'a"b<c' });
  const html = renderArticle(evil, {});
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('renderHome: featured = most recent, grid holds the rest + about card', () => {
  const articles = [
    Object.assign({}, sample, { slug: 'a', title: 'A', status: 'published', published_at: '2026-01-01T00:00:00Z' }),
    Object.assign({}, sample, { slug: 'b', title: 'B', status: 'published', published_at: '2026-03-01T00:00:00Z' }),
    Object.assign({}, sample, { slug: 'c', title: 'C', status: 'draft', published_at: null }),
  ];
  const html = renderHome(articles, { analyticsOrigin: 'https://api.klaxo.eu' });
  // Featured is the newest published (B).
  const featuredIdx = html.indexOf('Latest');
  assert.ok(html.indexOf('>B<') > featuredIdx);
  assert.ok(html.includes('href="a.html"'));
  assert.ok(!html.includes('href="c.html"')); // draft excluded
  assert.ok(html.includes('About this Blog'));
});

test('renderHome: empty state when nothing published', () => {
  const html = renderHome([], {});
  assert.ok(/No articles published yet/.test(html));
});

test('pickRelated: same category first, excludes self, max 3', () => {
  const pool = [
    { slug: 'self', category: 'X', published_at: '2026-01-01' },
    { slug: 'x1', category: 'X', published_at: '2026-02-01' },
    { slug: 'y1', category: 'Y', published_at: '2026-05-01' },
    { slug: 'y2', category: 'Y', published_at: '2026-04-01' },
    { slug: 'y3', category: 'Y', published_at: '2026-03-01' },
  ];
  const rel = pickRelated({ slug: 'self', category: 'X' }, pool);
  assert.strictEqual(rel.length, 3);
  assert.strictEqual(rel[0].slug, 'x1'); // same category first
  assert.ok(!rel.find((r) => r.slug === 'self'));
});

test('renderSitemap: lists static pages + published slugs', () => {
  const xml = renderSitemap([{ slug: 'coastal-drives', published_at: '2024-10-12T00:00:00Z' }]);
  assert.ok(xml.includes('<loc>'));
  assert.ok(xml.includes('/index.html'));
  assert.ok(xml.includes('/coastal-drives.html'));
  assert.ok(xml.includes('<lastmod>2024-10-12</lastmod>'));
});
