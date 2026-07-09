'use strict';

const { UAParser } = require('ua-parser-js');

/**
 * Derive coarse device/browser/os from a User-Agent string (#20).
 * Also flags obvious bots so the collector can drop them.
 */
const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|discordbot|preview|monitor|pingdom|lighthouse|headless|python-requests|curl|wget|axios|node-fetch/i;

function isBot(ua) {
  return BOT_RE.test(String(ua || ''));
}

function parseUA(ua) {
  const parser = new UAParser(String(ua || ''));
  const r = parser.getResult();
  const deviceType = r.device.type || 'desktop'; // ua-parser leaves desktop undefined
  return {
    device: deviceType,
    browser: r.browser.name || 'Unknown',
    os: r.os.name || 'Unknown',
    bot: isBot(ua),
  };
}

module.exports = { parseUA, isBot };
