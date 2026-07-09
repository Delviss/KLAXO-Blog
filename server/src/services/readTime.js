'use strict';

/**
 * Estimate reading time in minutes from rendered HTML body (#17).
 * ~220 words per minute; always at least 1 minute.
 */
const WPM = 220;

function countWords(html) {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').length;
}

function readTimeMinutes(html) {
  const words = countWords(html);
  return Math.max(1, Math.round(words / WPM));
}

module.exports = { readTimeMinutes, countWords };
