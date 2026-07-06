/**
 * KLAXO Google Review Widget
 * ---------------------------------------------------------------
 * A self-contained, dependency-free widget:
 *  - Floating badge (bottom-left) with the Google logo, the overall
 *    rating, stars and the review count.
 *  - Clicking the badge opens a "What our customers say" panel with
 *    the rating summary, a "View on Google" button and the reviews.
 *
 * HOW TO UPDATE:
 *  Everything you'd ever need to touch lives in KLAXO_REVIEWS_CONFIG
 *  below — the rating, the review count, the Google links and the
 *  reviews themselves. No other file needs changing.
 *
 *  NOTE: the reviews below are SAMPLE placeholders. Replace them with
 *  your real Google reviews (copy the name, relative date, star count
 *  and text from your Google Business profile).
 */
(function () {
  'use strict';

  var KLAXO_REVIEWS_CONFIG = {
    businessName: 'Klaxo Car Rentals',
    rating: 5.0,          // overall rating shown on the badge and panel
    reviewCount: 11,      // total number of Google reviews
    // Link opened by "View on Google" / the review count.
    // Tip: replace with your Google Business profile share link
    // (Google Business Profile > Share) or a maps place URL.
    placeUrl: 'https://www.google.com/maps/search/?api=1&query=Klaxo+Car+Rental+Munich',
    // Link opened by "Review us on Google".
    // Tip: replace with https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
    writeReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Klaxo+Car+Rental+Munich',
    // SAMPLE reviews — replace with your real ones.
    reviews: [
      {
        name: 'Sample Customer',
        date: '2 weeks ago',
        rating: 5,
        text: 'Replace this sample entry with a real review from your Google Business profile. Fantastic service from pickup to drop-off — the car was spotless and the team was incredibly helpful.'
      },
      {
        name: 'Another Customer',
        date: '1 month ago',
        rating: 5,
        text: 'Replace this sample entry with a real review. Booked a V-Class for a group trip to the Alps — smooth process, fair pricing and a beautifully maintained vehicle.'
      },
      {
        name: 'Third Customer',
        date: '2 months ago',
        rating: 5,
        text: 'Replace this sample entry with a real review. Quick handover at Munich, friendly staff and great recommendations for day trips. Will rent again.'
      }
    ]
  };

  /* ------------------------------------------------------------ */

  var GOOGLE_G_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    '</svg>';

  function starsHtml(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      var fill = rating >= i ? '#fbbc04' : (rating > i - 1 ? 'url(#krw-half)' : '#dadce0');
      html +=
        '<svg class="krw-star" viewBox="0 0 24 24" aria-hidden="true">' +
        '<defs><linearGradient id="krw-half"><stop offset="50%" stop-color="#fbbc04"/><stop offset="50%" stop-color="#dadce0"/></linearGradient></defs>' +
        '<path fill="' + fill + '" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>' +
        '</svg>';
    }
    return '<span class="krw-stars" role="img" aria-label="' + rating + ' out of 5 stars">' + html + '</span>';
  }

  function initialOf(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CSS =
    '#klaxo-review-widget,#klaxo-review-widget *{box-sizing:border-box;margin:0;}' +
    '.krw-badge{position:fixed;left:16px;bottom:16px;z-index:9990;display:flex;align-items:center;gap:10px;' +
    'background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:10px 14px;cursor:pointer;' +
    'box-shadow:0 10px 25px -5px rgba(0,0,0,.15),0 4px 10px -4px rgba(0,0,0,.1);' +
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif;transition:transform .25s ease,box-shadow .25s ease;}' +
    '.krw-badge:hover{transform:translateY(-3px);box-shadow:0 16px 30px -6px rgba(0,0,0,.2),0 6px 12px -4px rgba(0,0,0,.12);}' +
    '.krw-badge:focus-visible{outline:3px solid #1a73e8;outline-offset:2px;}' +
    '.krw-badge .krw-g{width:26px;height:26px;flex-shrink:0;}' +
    '.krw-badge .krw-g svg{width:100%;height:100%;display:block;}' +
    '.krw-badge-rating{font-size:20px;font-weight:700;color:#202124;line-height:1;font-family:"Space Grotesk","Plus Jakarta Sans",sans-serif;}' +
    '.krw-badge-meta{display:flex;flex-direction:column;align-items:flex-start;gap:3px;}' +
    '.krw-badge-count{font-size:11px;color:#5f6368;line-height:1;}' +
    '.krw-stars{display:inline-flex;gap:1px;}' +
    '.krw-star{width:14px;height:14px;}' +
    '.krw-badge .krw-star{width:13px;height:13px;}' +
    '.krw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9991;opacity:0;pointer-events:none;transition:opacity .3s ease;}' +
    '.krw-open .krw-overlay{opacity:1;pointer-events:auto;}' +
    '.krw-panel{position:fixed;left:0;top:0;bottom:0;z-index:9992;width:min(380px,100vw);background:#fff;' +
    'display:flex;flex-direction:column;box-shadow:8px 0 30px rgba(0,0,0,.18);' +
    'transform:translateX(-105%);transition:transform .35s cubic-bezier(.4,0,.2,1);' +
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif;}' +
    '.krw-open .krw-panel{transform:translateX(0);}' +
    '.krw-panel-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #eceef1;}' +
    '.krw-panel-title{font-size:16px;font-weight:700;color:#202124;font-family:"Space Grotesk","Plus Jakarta Sans",sans-serif;}' +
    '.krw-close{background:none;border:none;cursor:pointer;padding:6px;border-radius:50%;line-height:0;color:#5f6368;}' +
    '.krw-close:hover{background:#f1f3f4;}' +
    '.krw-close svg{width:20px;height:20px;}' +
    '.krw-summary{padding:24px 20px;text-align:center;border-bottom:1px solid #eceef1;}' +
    '.krw-summary-brand{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;}' +
    '.krw-summary-brand .krw-g{width:24px;height:24px;}' +
    '.krw-summary-brand .krw-g svg{width:100%;height:100%;display:block;}' +
    '.krw-summary-brand span{font-size:18px;font-weight:600;color:#5f6368;letter-spacing:.01em;}' +
    '.krw-summary-rating{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px;}' +
    '.krw-summary-rating strong{font-size:40px;font-weight:700;color:#202124;line-height:1;font-family:"Space Grotesk","Plus Jakarta Sans",sans-serif;}' +
    '.krw-summary .krw-star{width:18px;height:18px;}' +
    '.krw-summary-count{font-size:13px;color:#5f6368;margin-bottom:16px;}' +
    '.krw-summary-count a{color:inherit;text-decoration:underline;}' +
    '.krw-view-btn{display:block;width:100%;background:#1a73e8;color:#fff;font-weight:600;font-size:14px;' +
    'padding:12px 16px;border-radius:8px;text-align:center;text-decoration:none;transition:background .2s ease;}' +
    '.krw-view-btn:hover{background:#1765cc;}' +
    '.krw-write-link{display:inline-block;margin-top:12px;font-size:13px;color:#1a73e8;text-decoration:none;font-weight:600;}' +
    '.krw-write-link:hover{text-decoration:underline;}' +
    '.krw-list{flex:1;overflow-y:auto;padding:8px 20px 20px;}' +
    '.krw-review{padding:16px 0;border-bottom:1px solid #f1f3f4;}' +
    '.krw-review:last-child{border-bottom:none;}' +
    '.krw-review-head{display:flex;align-items:center;gap:10px;}' +
    '.krw-avatar{width:38px;height:38px;border-radius:50%;background:#ff8c00;color:#fff;display:flex;align-items:center;' +
    'justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;}' +
    '.krw-review-name{font-size:14px;font-weight:600;color:#202124;line-height:1.2;}' +
    '.krw-review-date{font-size:12px;color:#80868b;display:flex;align-items:center;gap:4px;}' +
    '.krw-review-date .krw-g{width:11px;height:11px;display:inline-block;}' +
    '.krw-review-date .krw-g svg{width:100%;height:100%;display:block;}' +
    '.krw-review .krw-stars{margin:8px 0 6px;}' +
    '.krw-review-text{font-size:13px;line-height:1.6;color:#3c4043;margin:0;}' +
    '.krw-footer{padding:12px 20px;border-top:1px solid #eceef1;text-align:center;font-size:10px;letter-spacing:.18em;' +
    'text-transform:uppercase;color:#9aa0a6;font-family:"Space Grotesk","Plus Jakarta Sans",sans-serif;}' +
    '@media (max-width:480px){' +
    '.krw-panel{width:100%;}' +
    '.krw-badge{left:12px;bottom:12px;padding:8px 12px;}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){.krw-panel,.krw-overlay,.krw-badge{transition:none;}}';

  function build() {
    var cfg = KLAXO_REVIEWS_CONFIG;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.id = 'klaxo-review-widget';

    var ratingLabel = cfg.rating.toFixed(1);
    var reviewsHtml = cfg.reviews.map(function (r) {
      return (
        '<article class="krw-review">' +
          '<div class="krw-review-head">' +
            '<span class="krw-avatar" aria-hidden="true">' + escapeHtml(initialOf(r.name)) + '</span>' +
            '<div>' +
              '<p class="krw-review-name">' + escapeHtml(r.name) + '</p>' +
              '<p class="krw-review-date"><span class="krw-g">' + GOOGLE_G_SVG + '</span>' + escapeHtml(r.date) + '</p>' +
            '</div>' +
          '</div>' +
          starsHtml(r.rating) +
          '<p class="krw-review-text">&ldquo;' + escapeHtml(r.text) + '&rdquo;</p>' +
        '</article>'
      );
    }).join('');

    root.innerHTML =
      '<button type="button" class="krw-badge" aria-haspopup="dialog" aria-expanded="false" ' +
        'aria-label="Google rating ' + ratingLabel + ' out of 5, ' + cfg.reviewCount + ' reviews. Open customer reviews.">' +
        '<span class="krw-g">' + GOOGLE_G_SVG + '</span>' +
        '<span class="krw-badge-meta">' +
          '<span class="krw-badge-rating">' + ratingLabel + '</span>' +
          starsHtml(cfg.rating) +
          '<span class="krw-badge-count">' + cfg.reviewCount + ' reviews</span>' +
        '</span>' +
      '</button>' +
      '<div class="krw-overlay"></div>' +
      '<aside class="krw-panel" role="dialog" aria-modal="true" aria-label="What our customers say" hidden>' +
        '<header class="krw-panel-header">' +
          '<span class="krw-panel-title">What our customers say</span>' +
          '<button type="button" class="krw-close" aria-label="Close reviews panel">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="krw-summary">' +
          '<div class="krw-summary-brand"><span class="krw-g">' + GOOGLE_G_SVG + '</span><span>Reviews</span></div>' +
          '<div class="krw-summary-rating"><strong>' + ratingLabel + '</strong>' + starsHtml(cfg.rating) + '</div>' +
          '<p class="krw-summary-count"><a href="' + cfg.placeUrl + '" target="_blank" rel="noopener">' + cfg.reviewCount + ' Google reviews</a></p>' +
          '<a class="krw-view-btn" href="' + cfg.placeUrl + '" target="_blank" rel="noopener">View on Google</a>' +
          '<a class="krw-write-link" href="' + cfg.writeReviewUrl + '" target="_blank" rel="noopener">Review us on Google</a>' +
        '</div>' +
        '<div class="krw-list">' + reviewsHtml + '</div>' +
        '<footer class="krw-footer">' + escapeHtml(cfg.businessName) + '</footer>' +
      '</aside>';

    document.body.appendChild(root);

    var badge = root.querySelector('.krw-badge');
    var overlay = root.querySelector('.krw-overlay');
    var panel = root.querySelector('.krw-panel');
    var closeBtn = root.querySelector('.krw-close');

    function open() {
      panel.hidden = false;
      // Let the browser paint the un-hidden panel before transitioning.
      requestAnimationFrame(function () {
        root.classList.add('krw-open');
      });
      badge.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }

    function close() {
      root.classList.remove('krw-open');
      badge.setAttribute('aria-expanded', 'false');
      panel.addEventListener('transitionend', function onEnd() {
        panel.hidden = true;
        panel.removeEventListener('transitionend', onEnd);
      });
      badge.focus();
    }

    badge.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('krw-open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
