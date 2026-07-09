'use strict';

/**
 * URL-safe slug generation (#17). Deterministic, ASCII-folded, collision-safe
 * via an async uniqueness check supplied by the caller.
 */

const MAP = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', Ä: 'ae', Ö: 'oe', Ü: 'ue',
  á: 'a', à: 'a', â: 'a', é: 'e', è: 'e', ê: 'e', í: 'i', ó: 'o', ô: 'o', ú: 'u', ñ: 'n', ç: 'c',
};

function slugify(input) {
  const s = String(input || '')
    .trim()
    .replace(/[äöüßÄÖÜáàâéèêíóôúñç]/g, (c) => MAP[c] || c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip remaining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return s || 'post';
}

/**
 * Produce a slug that does not collide. `exists(slug)` must resolve to the id
 * of any conflicting row, or null. `ignoreId` lets an update keep its own slug.
 */
async function uniqueSlug(base, exists, ignoreId = null) {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (true) {
    const conflictId = await exists(candidate);
    if (!conflictId || conflictId === ignoreId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

module.exports = { slugify, uniqueSlug };
