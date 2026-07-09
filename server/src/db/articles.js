'use strict';

const { query } = require('./pool');

const COLUMNS = `id, slug, title, excerpt, category, hero_image_url, hero_image_alt,
  body_html, body_json, author_name, read_time_minutes, status, seo_title, seo_description,
  publish_state, publish_error, last_commit_sha, published_at, created_at, updated_at`;

async function list({ status } = {}) {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = `WHERE status = $1`;
  }
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM articles ${where} ORDER BY COALESCE(published_at, updated_at) DESC`,
    params
  );
  return rows;
}

async function listPublished() {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM articles WHERE status = 'published' ORDER BY published_at DESC`
  );
  return rows;
}

async function getById(id) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM articles WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function getBySlug(slug) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM articles WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

/** Returns the id of a row with this slug, or null. */
async function slugExists(slug) {
  const { rows } = await query('SELECT id FROM articles WHERE slug = $1', [slug]);
  return rows[0] ? rows[0].id : null;
}

async function create(data) {
  const { rows } = await query(
    `INSERT INTO articles
      (slug, title, excerpt, category, hero_image_url, hero_image_alt,
       body_html, body_json, author_name, read_time_minutes, status,
       seo_title, seo_description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING ${COLUMNS}`,
    [
      data.slug,
      data.title,
      data.excerpt || '',
      data.category || 'Field Notes',
      data.hero_image_url || '',
      data.hero_image_alt || '',
      data.body_html || '',
      data.body_json || null,
      data.author_name || 'Daniel (Klaxo Team)',
      data.read_time_minutes || 5,
      data.status || 'draft',
      data.seo_title || null,
      data.seo_description || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await query(
    `UPDATE articles SET
       slug = COALESCE($2, slug),
       title = COALESCE($3, title),
       excerpt = COALESCE($4, excerpt),
       category = COALESCE($5, category),
       hero_image_url = COALESCE($6, hero_image_url),
       hero_image_alt = COALESCE($7, hero_image_alt),
       body_html = COALESCE($8, body_html),
       body_json = COALESCE($9, body_json),
       author_name = COALESCE($10, author_name),
       read_time_minutes = COALESCE($11, read_time_minutes),
       seo_title = COALESCE($12, seo_title),
       seo_description = COALESCE($13, seo_description)
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [
      id,
      data.slug ?? null,
      data.title ?? null,
      data.excerpt ?? null,
      data.category ?? null,
      data.hero_image_url ?? null,
      data.hero_image_alt ?? null,
      data.body_html ?? null,
      data.body_json ?? null,
      data.author_name ?? null,
      data.read_time_minutes ?? null,
      data.seo_title ?? null,
      data.seo_description ?? null,
    ]
  );
  return rows[0] || null;
}

/** Move to published state; set published_at once (first publish). */
async function markStatus(id, status) {
  const { rows } = await query(
    `UPDATE articles
       SET status = $2,
           published_at = CASE
             WHEN $2 = 'published' AND published_at IS NULL THEN now()
             ELSE published_at END
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id, status]
  );
  return rows[0] || null;
}

async function setPublishState(id, { publish_state, publish_error = null, last_commit_sha = null }) {
  const { rows } = await query(
    `UPDATE articles
       SET publish_state = $2, publish_error = $3,
           last_commit_sha = COALESCE($4, last_commit_sha)
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id, publish_state, publish_error, last_commit_sha]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await query('DELETE FROM articles WHERE id = $1 RETURNING slug, title', [id]);
  return rows[0] || null;
}

module.exports = {
  list,
  listPublished,
  getById,
  getBySlug,
  slugExists,
  create,
  update,
  markStatus,
  setPublishState,
  remove,
};
