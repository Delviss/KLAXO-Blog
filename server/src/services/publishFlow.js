'use strict';

const Articles = require('../db/articles');
const { publishArticle, unpublishArticle } = require('./publish');

/**
 * High-level publish flow (#18): keeps the DB publish_state in sync with the
 * GitHub commit so the dashboard can surface publishing / published /
 * publish_failed and offer a retry.
 */

async function doPublish(id) {
  let article = await Articles.markStatus(id, 'published');
  if (!article) throw Object.assign(new Error('not_found'), { status: 404 });

  await Articles.setPublishState(id, { publish_state: 'publishing' });
  const published = await Articles.listPublished();
  try {
    const result = await publishArticle(article, published);
    article = await Articles.setPublishState(id, {
      publish_state: 'published',
      publish_error: null,
      last_commit_sha: result.commit,
    });
    return { article, commit: result.commit, url: result.url };
  } catch (err) {
    await Articles.setPublishState(id, {
      publish_state: 'publish_failed',
      publish_error: err.message,
    });
    throw err;
  }
}

async function doUnpublish(id) {
  let article = await Articles.getById(id);
  if (!article) throw Object.assign(new Error('not_found'), { status: 404 });

  await Articles.markStatus(id, 'draft');
  await Articles.setPublishState(id, { publish_state: 'publishing' });
  const published = await Articles.listPublished(); // excludes this now

  try {
    const result = await unpublishArticle(article, published);
    article = await Articles.setPublishState(id, {
      publish_state: 'idle',
      publish_error: null,
      last_commit_sha: result.commit,
    });
    return { article, commit: result.commit, url: result.url };
  } catch (err) {
    await Articles.setPublishState(id, {
      publish_state: 'publish_failed',
      publish_error: err.message,
    });
    throw err;
  }
}

/**
 * Delete: remove the article file + row. If it was published, also delist it
 * from the homepage in the same commit.
 */
async function doDelete(id) {
  const article = await Articles.getById(id);
  if (!article) throw Object.assign(new Error('not_found'), { status: 404 });

  if (article.status === 'published') {
    await Articles.markStatus(id, 'draft');
    const published = await Articles.listPublished();
    await unpublishArticle(article, published); // removes file + rebuilds home
  }
  await Articles.remove(id);
  return { deleted: true, slug: article.slug };
}

module.exports = { doPublish, doUnpublish, doDelete };
