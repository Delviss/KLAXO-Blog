'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { slugify, uniqueSlug } = require('../src/services/slug');
const { readTimeMinutes, countWords } = require('../src/services/readTime');
const { sanitizeBody, toPlainText } = require('../src/services/sanitize');
const { parseUA, isBot } = require('../src/services/ua');
const { esc, formatDate } = require('../src/services/htmlUtils');

test('slugify: url-safe, ascii-folded, deduped dashes', () => {
  assert.strictEqual(slugify('Top 5 Hidden Coastal Drives!'), 'top-5-hidden-coastal-drives');
  assert.strictEqual(slugify('München Über Alpen'), 'muenchen-ueber-alpen');
  assert.strictEqual(slugify('  --weird__name--  '), 'weird-name');
  assert.strictEqual(slugify(''), 'post');
});

test('uniqueSlug: appends -2, -3 on collision, respects ignoreId', async () => {
  const taken = { 'coastal-drives': 'id1', 'coastal-drives-2': 'id2' };
  const exists = async (s) => taken[s] || null;
  assert.strictEqual(await uniqueSlug('Coastal Drives', exists), 'coastal-drives-3');
  assert.strictEqual(await uniqueSlug('Coastal Drives', exists, 'id1'), 'coastal-drives');
  assert.strictEqual(await uniqueSlug('Brand New', exists), 'brand-new');
});

test('readTime: ~220 wpm, floor of 1', () => {
  assert.strictEqual(readTimeMinutes(''), 1);
  const words = Array(440).fill('word').join(' ');
  assert.strictEqual(readTimeMinutes(`<p>${words}</p>`), 2);
  assert.strictEqual(countWords('<p>one two three</p>'), 3);
});

test('sanitize: strips scripts/onclick, keeps safe tags, hardens target=_blank', () => {
  const dirty = '<p onclick="evil()">Hi <strong>there</strong></p><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
  const clean = sanitizeBody(dirty);
  assert.ok(!/script/i.test(clean));
  assert.ok(!/onclick/i.test(clean));
  assert.ok(!/javascript:/i.test(clean));
  assert.ok(/<strong>there<\/strong>/.test(clean));

  const link = sanitizeBody('<a href="https://klaxo.eu" target="_blank">go</a>');
  assert.ok(/rel="noopener noreferrer"/.test(link));

  assert.strictEqual(toPlainText('<p>Hello <b>world</b></p>'), 'Hello world');
});

test('parseUA: classifies desktop/mobile + bot detection', () => {
  const chrome = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36');
  assert.strictEqual(chrome.browser, 'Chrome');
  assert.strictEqual(chrome.bot, false);
  assert.strictEqual(isBot('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
  assert.strictEqual(isBot('curl/8.0'), true);
});

test('htmlUtils: esc escapes entities; formatDate is stable UTC', () => {
  assert.strictEqual(esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.strictEqual(formatDate('2024-10-12T09:00:00Z'), 'October 12, 2024');
});
