'use strict';

const { esc, formatDate } = require('./htmlUtils');
const { head, HEADER, FOOTER, MOBILE_MENU_SCRIPT, trackScript } = require('./siteChrome');
const { toPlainText } = require('./sanitize');

/**
 * Render a full, standalone article HTML page from an article record (#18).
 * Output mirrors the structure of the existing hand-written article pages
 * (e.g. coastal-drives.html): header, hero, prose body, author bio, sidebar,
 * related grid, footer — plus the first-party tracking snippet.
 *
 * @param {object} article  Article record (slug, title, category, hero_image_url,
 *                          hero_image_alt, body_html, author_name, read_time_minutes,
 *                          published_at, excerpt, seo_title, seo_description)
 * @param {object} opts     { related: [{slug,title,category,excerpt,hero_image_url,hero_image_alt}],
 *                            analyticsOrigin, siteBaseUrl }
 */
function renderArticle(article, opts = {}) {
  const related = Array.isArray(opts.related) ? opts.related.slice(0, 3) : [];
  const analyticsOrigin = opts.analyticsOrigin || '';
  const siteBaseUrl = opts.siteBaseUrl || '';

  const seoTitle = article.seo_title || article.title;
  const description =
    article.seo_description ||
    article.excerpt ||
    toPlainText(article.body_html).slice(0, 155);
  const canonical = siteBaseUrl ? `${siteBaseUrl}/${article.slug}.html` : '';
  const dateStr = formatDate(article.published_at || article.created_at);
  const readTime = article.read_time_minutes || 5;
  const authorName = article.author_name || 'Daniel (Klaxo Team)';

  const relatedHtml = related.length
    ? related
        .map(
          (r) => `<a href="${esc(r.slug)}.html" class="group cursor-pointer hover-lift block" data-klaxo-track="related-${esc(r.slug)}">
<div class="relative overflow-hidden rounded-lg mb-4 sm:mb-6 h-52 sm:h-56 md:h-64">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${esc(r.hero_image_alt || r.title)}" data-alt="${esc(r.hero_image_alt || r.title)}" src="${esc(r.hero_image_url)}"/>
<div class="absolute top-3 sm:top-4 left-3 sm:left-4 bg-black text-white px-2 py-1 text-[10px] font-bold uppercase">${esc(r.category)}</div>
</div>
<h3 class="font-headline-md text-lg sm:text-xl md:text-headline-md leading-tight group-hover:text-primary-container transition-colors mb-2">${esc(r.title)}</h3>
<p class="text-on-surface-variant/80 text-sm">${esc(r.excerpt)}</p>
</a>`
        )
        .join('\n')
    : '';

  const relatedSection = related.length
    ? `<!-- Related Articles -->
<section class="bg-surface-container-lowest py-12 sm:py-16 md:py-24 lg:py-section-gap border-t border-outline-variant">
<div class="max-w-container-max mx-auto px-4 sm:px-6 md:px-margin-edge">
<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
<div>
<p class="text-primary font-label-bold text-label-bold uppercase tracking-[0.2em] mb-2">Continue the Journey</p>
<h2 class="font-headline-lg text-2xl sm:text-3xl md:text-headline-lg leading-tight animate-reveal">Related Adventures</h2>
</div>
<a class="text-zinc-900 font-label-bold text-label-bold uppercase border-b-2 border-zinc-900 pb-1 self-start sm:self-auto inline-flex items-center gap-2" href="index.html">View All Articles<span class="material-symbols-outlined text-base">arrow_forward</span></a>
</div>
<div data-related-grid class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-gutter">
${relatedHtml}
</div>
</div>
</section>`
    : '';

  return `<!DOCTYPE html>

<html class="light" lang="en"><head>
${head({ title: `Klaxo Travel Tips - ${seoTitle}`, description, canonical })}</head>
<body class="bg-surface font-body-md text-on-surface">
${HEADER}
<!-- Scroll Progress Bar -->
<div class="fixed top-[72px] left-0 w-full h-1 z-40 bg-zinc-200">
<div data-scroll-progress class="h-full bg-primary-container" style="width: 0%;"></div>
</div>
<!-- Hero Section -->
<section class="relative h-[420px] sm:h-[520px] md:h-[640px] lg:h-[716px] w-full overflow-hidden">
<img class="w-full h-full object-cover" alt="${esc(article.hero_image_alt)}" data-alt="${esc(article.hero_image_alt)}" src="${esc(article.hero_image_url)}"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 md:px-margin-edge">
<div class="max-w-container-max mx-auto w-full">
<div class="inline-block bg-primary-container text-white px-3 py-1 text-label-bold font-label-bold uppercase mb-3 sm:mb-4">
                    ${esc(article.category)}
                </div>
<h1 class="text-white font-display-xl text-3xl sm:text-4xl md:text-5xl lg:text-display-xl leading-tight max-w-4xl animate-reveal">
                    ${esc(article.title)}
                </h1>
<div class="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-8 text-white/90">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary-container text-xl sm:text-2xl">calendar_today</span>
<span class="font-label-bold text-label-bold uppercase">${esc(dateStr)}</span>
</div>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary-container text-xl sm:text-2xl">speed</span>
<span class="font-label-bold text-label-bold uppercase">${esc(readTime)} Min Read</span>
</div>
</div>
</div>
</div>
</section>
<!-- Main Content Layout -->
<main class="max-w-container-max mx-auto px-4 sm:px-6 md:px-margin-edge py-12 sm:py-16 md:py-24 lg:py-section-gap grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-gutter">
<!-- Article Content -->
<article class="lg:col-span-8 space-y-10 sm:space-y-12">
<div class="prose max-w-none">
${article.body_html || ''}
</div>
<!-- Author Bio -->
<div class="border-t border-outline-variant pt-10 sm:pt-12 mt-12 sm:mt-16">
<div class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 p-5 sm:p-6 md:p-8 bg-surface-container-low rounded-xl">
<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-container border-2 border-primary-container shrink-0 flex items-center justify-center" aria-label="Klaxo logo"><span class="material-symbols-outlined text-white text-4xl sm:text-5xl" style="font-variation-settings: 'FILL' 1;">speed</span></div>
<div>
<h4 class="font-headline-md text-xl sm:text-2xl md:text-headline-md">${esc(authorName)}</h4>
<p class="text-on-surface-variant font-body-md mb-2 text-sm sm:text-base">Klaxo GmbH &middot; Munich</p>
<p class="text-on-surface-variant/80 text-sm">Part of the Klaxo Team in Munich. Every route is driven before it is recommended, with first-hand experience of the Klaxo fleet — Toyota Corolla Hybrid, Mercedes GLE, VW Tiguan, Mercedes Vito, V-Class, Tesla Model 3 and Mercedes S-Class.</p>
</div>
</div>
</div>
</article>
<!-- Sidebar -->
<aside class="lg:col-span-4 space-y-gutter">
<div class="lg:sticky lg:top-28 space-y-6 lg:space-y-gutter">
<!-- Recommended Rental Card -->
<div class="bg-white border border-outline-variant p-5 sm:p-6 rounded-xl shadow-sm">
<h3 class="font-headline-md text-xl sm:text-2xl md:text-headline-md mb-5 sm:mb-6">Recommended for this Route</h3>
<div class="relative mb-5 sm:mb-6"><img class="w-full h-44 sm:h-48 object-cover rounded-lg" alt="A premium Klaxo rental vehicle at a scenic Bavarian overlook." data-alt="A premium Klaxo rental vehicle at a scenic Bavarian overlook." src="https://unsplash.com/photos/ZmP8No2SDGU/download?force=true&amp;w=1600&amp;fm=jpg"/>
<div class="absolute top-2 right-2 bg-zinc-900 text-white px-2 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded">
                            Premium
                        </div>
</div>
<div class="flex flex-wrap justify-between items-end gap-3 mb-5 sm:mb-6">
<div class="min-w-0">
<p class="text-on-surface-variant text-xs sm:text-sm font-label-bold uppercase">The Klaxo Fleet</p>
<h4 class="text-lg sm:text-xl font-bold">Book your car</h4>
</div>
<div class="text-right shrink-0">
<p class="text-primary font-bold text-xl">klaxo.eu</p>
<p class="text-[10px] uppercase font-bold text-on-surface-variant">Per Day</p>
</div>
</div>
<a href="https://www.klaxo.eu/#rental" class="w-full bg-primary-container text-white py-3 sm:py-4 rounded-lg font-label-bold text-label-bold uppercase transition-transform duration-300 flex justify-center items-center gap-2 btn-premium-transition" data-klaxo-track="sidebar-rent-now">
                        Rent Now
                        <span class="material-symbols-outlined">arrow_forward</span>
</a>
</div>
<!-- Newsletter CTA -->
<div class="bg-primary-container p-6 sm:p-8 rounded-xl text-white relative overflow-hidden">
<div class="relative z-10">
<h4 class="font-headline-md text-xl sm:text-2xl md:text-headline-md mb-3 sm:mb-4 leading-tight">Get Exclusive Travel Maps</h4>
<p class="mb-5 sm:mb-6 text-white/90 text-sm sm:text-base">Join 50k+ adventurers and get our secret GPS routes monthly.</p>
<input class="w-full bg-white/20 border border-white/30 rounded py-3 px-4 mb-4 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white" placeholder="Your email address" type="email"/>
<a href="https://www.klaxo.eu/#newsletter" class="w-full bg-zinc-900 text-white py-3 rounded font-label-bold text-label-bold uppercase btn-premium-transition block text-center" data-klaxo-track="sidebar-newsletter">Subscribe</a>
</div>
<div class="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 pointer-events-none">
<span class="material-symbols-outlined text-[120px] sm:text-[160px]" style="font-variation-settings: 'FILL' 1;">speed</span>
</div>
</div>
</div>
</aside>
</main>
${relatedSection}
${FOOTER}
${MOBILE_MENU_SCRIPT}
<!-- GSAP + ScrollTrigger (HeroScrub-inspired animations) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="js/animations.js" defer></script>
${trackScript({ analyticsOrigin, slug: article.slug })}
</body></html>
`;
}

module.exports = { renderArticle };
