'use strict';

const helmet = require('helmet');

/**
 * Helmet security headers, relaxed just enough for the dashboard, which loads
 * Tailwind + fonts + a rich-text editor from CDNs (matching the public site's
 * approach). The public site itself is served by GitHub Pages, not this app.
 */
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
    // Allow the dashboard preview iframe to load same-origin generated HTML.
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
}

module.exports = { securityHeaders };
