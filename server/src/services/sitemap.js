'use strict';

const { esc } = require('./htmlUtils');
const { config } = require('../config');

/** Build a sitemap.xml string from published articles + static pages (#18). */
function renderSitemap(published) {
  const base = config.github.siteBaseUrl;
  const staticPages = ['index.html', 'about.html'];
  const urls = [];

  for (const p of staticPages) {
    urls.push(`  <url><loc>${esc(base)}/${p}</loc></url>`);
  }
  for (const a of published) {
    const lastmod = a.published_at || a.updated_at || a.created_at;
    const iso = lastmod ? new Date(lastmod).toISOString().slice(0, 10) : '';
    const lm = iso ? `<lastmod>${iso}</lastmod>` : '';
    urls.push(`  <url><loc>${esc(base)}/${esc(a.slug)}.html</loc>${lm}</url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

module.exports = { renderSitemap };
