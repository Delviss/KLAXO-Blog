'use strict';

const sanitizeHtml = require('sanitize-html');

/**
 * Sanitise editor-produced HTML before it is stored/rendered (#17), to prevent
 * stored XSS. Allows the tags the WYSIWYG editor and our article styling use.
 */
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'code', 'pre',
    'ul', 'ol', 'li',
    'a', 'img', 'figure', 'figcaption',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'class', 'data-alt'],
    span: ['class'],
    div: ['class'],
    p: ['class'],
    h2: ['class'],
    h3: ['class'],
    h4: ['class'],
    blockquote: ['class'],
    figure: ['class'],
    figcaption: ['class'],
    ul: ['class'],
    ol: ['class'],
    li: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    // Force safe rel on links that open a new tab.
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        attribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
  },
  disallowedTagsMode: 'discard',
};

function sanitizeBody(html) {
  return sanitizeHtml(String(html || ''), OPTIONS);
}

/** Strip everything to plain text (for excerpts / SEO fallbacks). */
function toPlainText(html) {
  return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { sanitizeBody, toPlainText, OPTIONS };
