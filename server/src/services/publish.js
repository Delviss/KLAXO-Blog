'use strict';

const { config } = require('../config');
const { renderArticle } = require('./renderArticle');
const { renderHome } = require('./renderHome');
const { renderSitemap } = require('./sitemap');
const { commitFiles } = require('./github');

/**
 * Orchestrates the static auto-publish pipeline (#18).
 *
 * These functions are DB-agnostic: the caller passes the affected article and
 * the full list of currently-published articles (already reflecting the change
 * being made), and we render + commit the resulting file set in one commit.
 */

const analyticsOrigin = config.appUrl;
const siteBaseUrl = config.github.siteBaseUrl;

/** Pick up to 3 related articles (same category first, then most recent). */
function pickRelated(article, published) {
  const byRecent = (a, b) =>
    new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
  const others = published.filter((a) => a.slug !== article.slug);
  const sameCat = others.filter((a) => a.category === article.category).sort(byRecent);
  const rest = others.filter((a) => a.category !== article.category).sort(byRecent);
  // Same-category matches lead; only then the newest from other categories.
  return [...sameCat, ...rest].slice(0, 3);
}

/** Build the file set for the current published state + a changed article. */
function buildFiles(article, published, { includeArticle }) {
  const files = [];
  if (includeArticle) {
    const related = pickRelated(article, published);
    files.push({
      path: `${article.slug}.html`,
      content: renderArticle(article, { related, analyticsOrigin, siteBaseUrl }),
    });
  }
  files.push({ path: 'index.html', content: renderHome(published, { analyticsOrigin }) });
  files.push({ path: 'sitemap.xml', content: renderSitemap(published) });
  return files;
}

/**
 * Publish or update a single article. `published` must be the full list of
 * published articles INCLUDING this one.
 */
async function publishArticle(article, published) {
  const files = buildFiles(article, published, { includeArticle: true });
  const result = await commitFiles({
    files,
    message: `Publish: ${article.title} (${article.slug})`,
  });
  return result;
}

/**
 * Unpublish/delete an article: remove its .html and regenerate the homepage.
 * `published` must be the list AFTER removing this article.
 */
async function unpublishArticle(article, published) {
  const files = buildFiles(article, published, { includeArticle: false });
  const result = await commitFiles({
    files,
    deletions: [`${article.slug}.html`],
    message: `Unpublish: ${article.title} (${article.slug})`,
  });
  return result;
}

/** Render the article HTML without committing — used for dashboard preview. */
function previewArticle(article, published) {
  const related = pickRelated(article, published || []);
  return renderArticle(article, { related, analyticsOrigin, siteBaseUrl });
}

module.exports = { publishArticle, unpublishArticle, previewArticle, pickRelated, buildFiles };
