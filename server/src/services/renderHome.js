'use strict';

const { esc, formatDate } = require('./htmlUtils');
const { head, HEADER, FOOTER, MOBILE_MENU_SCRIPT, trackScript } = require('./siteChrome');

/**
 * Regenerate index.html from the list of published articles (#18).
 * The most recent published post becomes the "Latest" featured card; the
 * remainder fill the article grid (newest first). An "About this Blog" card
 * always closes the grid.
 */
function renderHome(articles, opts = {}) {
  const analyticsOrigin = opts.analyticsOrigin || '';
  const published = (articles || [])
    .filter((a) => a.status === 'published')
    .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

  const featured = published[0] || null;
  const rest = featured ? published.slice(1) : [];

  const featuredSection = featured
    ? `<!-- Featured Article -->
<section class="max-w-container-max mx-auto px-4 sm:px-6 md:px-margin-edge py-12 sm:py-16 md:py-24">
<p class="text-primary font-label-bold text-label-bold uppercase tracking-[0.2em] mb-3">Latest</p>
<a href="${esc(featured.slug)}.html" class="group block hover-lift" data-klaxo-track="featured-${esc(featured.slug)}">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
<div class="relative overflow-hidden rounded-xl h-64 sm:h-80 md:h-[440px]">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="${esc(featured.hero_image_alt || featured.title)}" data-alt="${esc(featured.hero_image_alt || featured.title)}" src="${esc(featured.hero_image_url)}"/>
<div class="absolute top-3 sm:top-4 left-3 sm:left-4 bg-primary-container text-white px-3 py-1 text-[10px] sm:text-label-bold font-label-bold uppercase">${esc(featured.category)}</div>
</div>
<div>
<h2 class="font-headline-lg text-2xl sm:text-3xl md:text-headline-lg leading-tight mb-4 group-hover:text-primary-container transition-colors">${esc(featured.title)}</h2>
<p class="text-on-surface-variant text-base sm:text-body-md mb-5">${esc(featured.excerpt)}</p>
<div class="flex flex-wrap items-center gap-3 sm:gap-5 text-on-surface-variant text-sm">
<span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary-container">person</span>${esc(featured.author_name)}</span>
<span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary-container">calendar_today</span>${esc(formatDate(featured.published_at || featured.created_at))}</span>
<span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary-container">speed</span>${esc(featured.read_time_minutes)} Min Read</span>
</div>
<span class="inline-flex items-center gap-2 mt-6 font-label-bold text-label-bold uppercase border-b-2 border-zinc-900 pb-1 text-zinc-900 group-hover:text-primary-container group-hover:border-primary-container transition-colors">Read Article<span class="material-symbols-outlined text-base">arrow_forward</span></span>
</div>
</div>
</a>
</section>`
    : '';

  const cards = rest
    .map(
      (a) => `<a href="${esc(a.slug)}.html" class="group hover-lift block bg-white border border-outline-variant rounded-xl overflow-hidden" data-klaxo-track="card-${esc(a.slug)}">
<div class="relative h-52 sm:h-56 md:h-64 overflow-hidden">
<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${esc(a.hero_image_alt || a.title)}" data-alt="${esc(a.hero_image_alt || a.title)}" src="${esc(a.hero_image_url)}"/>
<div class="absolute top-3 left-3 bg-black text-white px-2 py-1 text-[10px] font-bold uppercase">${esc(a.category)}</div>
</div>
<div class="p-5 sm:p-6">
<h3 class="font-headline-md text-lg sm:text-xl md:text-headline-md leading-tight group-hover:text-primary-container transition-colors mb-2">${esc(a.title)}</h3>
<p class="text-on-surface-variant/80 text-sm mb-4">${esc(a.excerpt)}</p>
<div class="flex items-center gap-3 text-xs text-on-surface-variant"><span class="material-symbols-outlined text-primary-container text-base">person</span>${esc(a.author_name)}<span class="ml-auto flex items-center gap-1"><span class="material-symbols-outlined text-base">speed</span>${esc(a.read_time_minutes)} min</span></div>
</div>
</a>`
    )
    .join('\n');

  const aboutCard = `<a href="about.html" class="group hover-lift block bg-primary-container text-white rounded-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
<div>
<span class="material-symbols-outlined text-4xl sm:text-5xl mb-4">info</span>
<h3 class="font-headline-md text-xl sm:text-2xl md:text-headline-md mb-3 leading-tight">About this Blog</h3>
<p class="text-white/90 text-sm mb-6">An editorial companion to klaxo.eu, written by the Klaxo Team. Routes are driven before they are recommended; rental advice always reflects our real-world fleet.</p>
</div>
<span class="inline-flex items-center gap-2 font-label-bold text-label-bold uppercase border-b-2 border-white pb-1 self-start">Learn More<span class="material-symbols-outlined text-base">arrow_forward</span></span>
</a>`;

  const emptyState = published.length
    ? ''
    : `<p class="col-span-full text-on-surface-variant text-center py-12">No articles published yet. Check back soon.</p>`;

  return `<!DOCTYPE html>

<html class="light" lang="en"><head>
${head({
    title: 'Klaxo Travel Tips - Premium Driving & Travel Stories from Bavaria',
    description:
      'The official Klaxo Travel Tips blog: rental advice, scenic drives, alpine transfers and eco-friendly travel from Munich and across Bavaria.',
  })}</head>
<body class="bg-surface font-body-md text-on-surface">
${HEADER}
<!-- Scroll Progress Bar -->
<div class="fixed top-[72px] left-0 w-full h-1 z-40 bg-zinc-800">
<div data-scroll-progress class="h-full bg-primary-container" style="width: 0%;"></div>
</div>
<!-- Hero -->
<section class="relative bg-zinc-900 text-white py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-margin-edge overflow-hidden">
<div class="max-w-container-max mx-auto relative z-10">
<div class="inline-block bg-primary-container text-white px-3 py-1 text-label-bold font-label-bold uppercase mb-3 sm:mb-4">The Klaxo Travel Tips Blog</div>
<h1 class="font-display-xl text-3xl sm:text-4xl md:text-5xl lg:text-display-xl leading-tight max-w-4xl animate-reveal">Stories from the road, fueled by Klaxo.</h1>
<p class="font-body-lg text-base sm:text-body-lg text-white/80 mt-4 sm:mt-6 max-w-3xl">Practical guides for renting, driving and exploring across Munich, Bavaria, Austria and Switzerland — written by the Klaxo Team from <a class="text-orange-400 underline hover:text-orange-300" href="https://www.klaxo.eu/" data-klaxo-track="hero-klaxo">klaxo.eu</a>.</p>
</div>
<div class="absolute -right-12 -bottom-12 opacity-10 pointer-events-none"><span class="material-symbols-outlined text-[180px] sm:text-[240px] md:text-[320px] text-primary-container" style="font-variation-settings: 'FILL' 1;">speed</span></div>
</section>
${featuredSection}
<!-- Article Grid -->
<section class="bg-surface-container-lowest border-t border-outline-variant py-12 sm:py-16 md:py-24 lg:py-section-gap">
<div class="max-w-container-max mx-auto px-4 sm:px-6 md:px-margin-edge">
<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
<div>
<p class="text-primary font-label-bold text-label-bold uppercase tracking-[0.2em] mb-2">All Articles</p>
<h2 class="font-headline-lg text-2xl sm:text-3xl md:text-headline-lg leading-tight">Travel Tips &amp; Driving Guides</h2>
</div>
<a class="text-zinc-900 font-label-bold text-label-bold uppercase border-b-2 border-zinc-900 pb-1 self-start sm:self-auto inline-flex items-center gap-2" href="https://www.klaxo.eu/#rental" data-klaxo-track="grid-rent">Rent a Car<span class="material-symbols-outlined text-base">arrow_forward</span></a>
</div>
<div data-related-grid class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-gutter">
${emptyState}${cards}
${aboutCard}
</div>
</div>
</section>
<!-- Fleet Banner -->
<section class="bg-zinc-950 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-margin-edge">
<div class="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
<div>
<p class="text-primary-container font-label-bold text-label-bold uppercase tracking-[0.2em] mb-3">The Klaxo Fleet</p>
<h2 class="font-headline-lg text-2xl sm:text-3xl md:text-headline-lg leading-tight mb-4">Driven, tested and recommended</h2>
<p class="text-white/80 text-base sm:text-body-md mb-6">Every recommendation on this blog is from our real fleet — Toyota Corolla Hybrid, Mercedes GLE, VW Tiguan, Mercedes Vito, Mercedes V-Class, Tesla Model 3 and Mercedes S-Class.</p>
<a href="https://www.klaxo.eu/#fleet" class="inline-flex items-center gap-2 bg-primary-container text-white px-5 py-3 rounded-full font-label-bold text-label-bold uppercase btn-premium-transition" data-klaxo-track="fleet-explore">Explore the Fleet<span class="material-symbols-outlined">arrow_forward</span></a>
</div>
<div class="grid grid-cols-2 gap-4 text-sm">
<div class="bg-zinc-900 rounded-xl p-5"><span class="material-symbols-outlined text-primary-container text-2xl mb-2">eco</span><p class="font-bold mb-1">Toyota Corolla Hybrid</p><p class="text-white/60 text-xs">Hybrid Sedan</p></div>
<div class="bg-zinc-900 rounded-xl p-5"><span class="material-symbols-outlined text-primary-container text-2xl mb-2">terrain</span><p class="font-bold mb-1">Mercedes GLE / VW Tiguan</p><p class="text-white/60 text-xs">Premium SUVs</p></div>
<div class="bg-zinc-900 rounded-xl p-5"><span class="material-symbols-outlined text-primary-container text-2xl mb-2">groups</span><p class="font-bold mb-1">Mercedes Vito / V-Class</p><p class="text-white/60 text-xs">Multi-Seaters</p></div>
<div class="bg-zinc-900 rounded-xl p-5"><span class="material-symbols-outlined text-primary-container text-2xl mb-2">bolt</span><p class="font-bold mb-1">Tesla Model 3 / S-Class</p><p class="text-white/60 text-xs">Luxury</p></div>
</div>
</div>
</section>
${FOOTER}
${MOBILE_MENU_SCRIPT}
<!-- GSAP + ScrollTrigger (HeroScrub-inspired animations) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="js/animations.js" defer></script>
${trackScript({ analyticsOrigin, slug: '' })}
</body></html>
`;
}

module.exports = { renderHome };
