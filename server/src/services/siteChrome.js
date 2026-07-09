'use strict';

const { esc } = require('./htmlUtils');

/**
 * Shared markup for generated static pages (#18). Kept in one place so every
 * generated article + the homepage share byte-identical chrome with the
 * existing hand-written pages (same Tailwind config, fonts, header, footer).
 */

const TAILWIND_CONFIG = `<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-fixed": "#e2e2e2",
                    "primary-container": "#ff8c00",
                    "tertiary-container": "#a9aaaa",
                    "on-secondary-fixed-variant": "#474746",
                    "tertiary-fixed-dim": "#c6c6c7",
                    "on-surface-variant": "#564334",
                    "inverse-surface": "#3a2e25",
                    "outline": "#897362",
                    "surface": "#fff8f5",
                    "surface-container-low": "#fff1e9",
                    "on-background": "#241912",
                    "inverse-on-surface": "#ffede3",
                    "surface-dim": "#ead6c9",
                    "on-secondary": "#ffffff",
                    "error-container": "#ffdad6",
                    "tertiary": "#5d5f5f",
                    "secondary-fixed-dim": "#c8c6c5",
                    "outline-variant": "#ddc1ae",
                    "error": "#ba1a1a",
                    "on-tertiary": "#ffffff",
                    "on-error-container": "#93000a",
                    "surface-bright": "#fff8f5",
                    "on-primary": "#ffffff",
                    "surface-container-lowest": "#ffffff",
                    "surface-variant": "#f3dfd1",
                    "surface-container": "#ffeadd",
                    "on-tertiary-fixed": "#1a1c1c",
                    "on-error": "#ffffff",
                    "primary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2f1500",
                    "surface-container-high": "#f9e4d7",
                    "inverse-primary": "#ffb77d",
                    "on-primary-container": "#623200",
                    "primary-fixed-dim": "#ffb77d",
                    "on-tertiary-fixed-variant": "#454747",
                    "surface-container-highest": "#f3dfd1",
                    "on-tertiary-container": "#3d3f3f",
                    "background": "#fff8f5",
                    "secondary": "#5f5e5e",
                    "on-secondary-fixed": "#1c1b1b",
                    "secondary-container": "#e2dfde",
                    "surface-tint": "#904d00",
                    "on-secondary-container": "#636262",
                    "on-primary-fixed-variant": "#6e3900",
                    "secondary-fixed": "#e5e2e1",
                    "on-surface": "#241912",
                    "primary": "#904d00"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "container-max": "1280px",
                    "unit": "8px",
                    "margin-edge": "32px",
                    "gutter": "24px",
                    "element-gap": "24px",
                    "section-gap": "120px"
            },
            "fontFamily": {
                    "label-bold": ["Plus Jakarta Sans"],
                    "body-lg": ["Plus Jakarta Sans"],
                    "body-md": ["Plus Jakarta Sans"],
                    "headline-lg": ["Space Grotesk"],
                    "display-xl": ["Space Grotesk"],
                    "headline-md": ["Space Grotesk"]
            },
            "fontSize": {
                    "label-bold": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.05em", "fontWeight": "700"}],
                    "body-lg": ["18px", {"lineHeight": "1.7", "fontWeight": "400"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-lg": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                    "display-xl": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-md": ["28px", {"lineHeight": "1.3", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>`;

const STYLES = `<style>
        .speed-line {
            width: 40px;
            height: 4px;
            background: #ff8c00;
            display: inline-block;
            margin-right: 8px;
            position: relative;
        }
        .speed-line::before {
            content: '';
            position: absolute;
            left: -12px;
            width: 20px;
            height: 4px;
            background: rgba(255, 140, 0, 0.4);
        }
        .speed-line::after {
            content: '';
            position: absolute;
            left: -20px;
            width: 6px;
            height: 4px;
            background: rgba(255, 140, 0, 0.2);
        }
        .article-card-hover:hover {
            transform: translateX(8px);
            transition: all 0.3s ease;
        }
    </style>
<style>
    @keyframes slideUpFade {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-reveal { animation: slideUpFade 0.8s ease-out forwards; }
    .hover-lift { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    .btn-premium-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-premium-transition:hover { filter: brightness(1.1); transform: scale(1.02); }
    .image-premium-hover { transition: all 0.5s ease; }
    .image-premium-hover:hover { filter: brightness(1.05) contrast(1.05); transform: scale(1.02); }
</style>`;

function head(opts = {}) {
  const title = esc(opts.title || 'Klaxo Travel Tips');
  const description = esc(opts.description || '');
  const canonical = opts.canonical ? `\n<link rel="canonical" href="${esc(opts.canonical)}"/>` : '';
  return `<meta charset="utf-8"/>
<title>${title}</title>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="description" content="${description}"/>${canonical}
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
${TAILWIND_CONFIG}
${STYLES}`;
}

const HEADER = `<!-- TopNavBar -->
<header class="bg-white w-full sticky top-0 z-50 border-b border-zinc-200 shadow-sm">
<div class="flex justify-between items-center gap-3 sm:gap-6 w-full px-4 sm:px-6 py-3">
<div class="flex items-center gap-4 lg:gap-6 shrink-0">
<a href="index.html" class="font-['Space_Grotesk'] tracking-tighter leading-none flex flex-col">
<span class="text-xl sm:text-2xl font-black italic uppercase text-primary-container">Klaxo</span>
<span class="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mt-0.5">Travel Tips</span>
</a>
<div class="relative group hidden md:block">
<button class="flex items-center gap-1 text-zinc-800 hover:text-zinc-900 font-['Space_Grotesk'] font-semibold py-2" type="button">
                Discover
                <span class="material-symbols-outlined text-lg transition-transform group-hover:rotate-180">expand_more</span>
</button>
<div class="absolute left-0 top-full pt-3 w-64 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition duration-150">
<div class="bg-white border border-zinc-200 rounded-xl shadow-xl p-2">
<a href="index.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50">
<span class="material-symbols-outlined text-primary-container">tips_and_updates</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Travel Tips</span>
</a>
<a href="https://www.klaxo.eu/packages" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50" data-klaxo-track="nav-destinations">
<span class="material-symbols-outlined text-primary-container">map</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Destinations</span>
</a>
<a href="https://www.klaxo.eu/#fleet" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50" data-klaxo-track="nav-fleet">
<span class="material-symbols-outlined text-primary-container">explore</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Explore the Fleet</span>
</a>
<a href="about.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50">
<span class="material-symbols-outlined text-primary-container">info</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">About</span>
</a>
</div>
</div>
</div>
</div>
<form class="hidden md:flex flex-1 max-w-2xl items-center gap-3 bg-white border border-zinc-300 hover:border-zinc-500 focus-within:border-zinc-900 focus-within:shadow-md rounded-full py-3 px-5 transition" role="search">
<span class="material-symbols-outlined text-zinc-500">search</span>
<input type="search" placeholder="Search for a place or guide" class="flex-1 bg-transparent outline-none placeholder:text-zinc-500 text-zinc-900 font-['Plus_Jakarta_Sans']" aria-label="Search for a place or guide"/>
</form>
<div class="flex items-center gap-1 shrink-0">
<button id="mobile-menu-btn" class="md:hidden flex items-center gap-2 border border-zinc-300 rounded-full pl-3 pr-1 py-1 hover:shadow-md transition" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu" type="button">
<span id="mobile-menu-icon" class="material-symbols-outlined text-zinc-700 text-lg">menu</span>
<span class="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
<span class="material-symbols-outlined text-zinc-600 text-lg">person</span>
</span>
</button>
</div>
</div>
<!-- Mobile menu drawer -->
<div id="mobile-menu" class="hidden md:hidden bg-white border-t border-zinc-200 shadow-lg max-h-[calc(100vh-72px)] overflow-y-auto">
<div class="p-4 space-y-3">
<nav class="flex flex-col">
<a href="index.html" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 active:bg-zinc-100">
<span class="material-symbols-outlined text-primary-container">tips_and_updates</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Travel Tips</span>
</a>
<a href="https://www.klaxo.eu/packages" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 active:bg-zinc-100" data-klaxo-track="nav-destinations">
<span class="material-symbols-outlined text-primary-container">map</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Destinations</span>
</a>
<a href="https://www.klaxo.eu/#fleet" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 active:bg-zinc-100" data-klaxo-track="nav-fleet">
<span class="material-symbols-outlined text-primary-container">explore</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">Explore the Fleet</span>
</a>
<a href="about.html" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 active:bg-zinc-100">
<span class="material-symbols-outlined text-primary-container">info</span>
<span class="font-['Space_Grotesk'] font-semibold text-zinc-800">About</span>
</a>
</nav>
<a href="https://www.klaxo.eu/#rental" class="block w-full text-center bg-primary-container text-white font-['Space_Grotesk'] font-bold tracking-tighter uppercase px-4 py-3 rounded-full btn-premium-transition" data-klaxo-track="rent-now-mobile">
                    Rent Now
                </a>
</div>
</div>
</header>`;

const FOOTER = `<!-- Footer -->
<footer class="bg-zinc-950 mt-12 sm:mt-16 w-full pt-10 sm:pt-16 pb-6 border-t-8 border-zinc-900 rounded-t-xl">
<div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
<div class="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-3">
<div>
<div class="flex justify-center gap-3 sm:justify-start items-center">
<div class="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">speed</span>
</div>
<span class="text-3xl font-black italic text-orange-500 uppercase font-['Space_Grotesk'] tracking-tighter">Klaxo</span>
</div>
<p class="text-zinc-400 mt-6 max-w-md text-center sm:max-w-xs sm:text-left leading-relaxed">Defining the next generation of premium car rentals and travel experiences across Europe. A backlink blog by <a href="https://www.klaxo.eu/" class="text-orange-400 hover:underline" data-klaxo-track="footer-klaxo">klaxo.eu</a>.</p>
<ul class="mt-8 flex justify-center gap-4 sm:justify-start">
<li><a href="https://www.klaxo.eu/contact" aria-label="Share Klaxo" class="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><span class="material-symbols-outlined text-base">share</span></a></li>
<li><a href="mailto:info@klaxo.eu" aria-label="Email Klaxo" class="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><span class="material-symbols-outlined text-base">mail</span></a></li>
<li><a href="https://www.klaxo.eu/#newsletter" aria-label="Newsletter" class="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><span class="material-symbols-outlined text-base">notifications</span></a></li>
<li><a href="https://www.klaxo.eu/" aria-label="Klaxo Website" class="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><span class="material-symbols-outlined text-base">language</span></a></li>
</ul>
</div>
<div class="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 lg:col-span-2 font-['Space_Grotesk'] text-sm tracking-wide">
<div class="text-center sm:text-left">
<p class="text-white font-bold uppercase tracking-widest text-sm mb-6">Navigation</p>
<ul class="space-y-4">
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/#rental" data-klaxo-track="footer-rent">Rent a Car</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/packages">Destinations</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/#fleet">Fleet Guide</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="index.html">Travel Blog</a></li>
</ul>
</div>
<div class="text-center sm:text-left">
<p class="text-white font-bold uppercase tracking-widest text-sm mb-6">Travel Tips</p>
<ul class="space-y-4">
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="coastal-drives.html">Coastal Drives</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="day-trips-from-munich.html">Day Trips</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="alpine-transfers.html">Alpine Transfers</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="sustainable-mobility.html">Sustainable Mobility</a></li>
</ul>
</div>
<div class="text-center sm:text-left">
<p class="text-white font-bold uppercase tracking-widest text-sm mb-6">Support</p>
<ul class="space-y-4">
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/privacy">Privacy Policy</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/terms">Terms of Service</a></li>
<li><a class="text-zinc-500 hover:text-orange-400 transition-colors" href="https://www.klaxo.eu/contact">Help Center</a></li>
<li><a href="https://www.klaxo.eu/#newsletter" class="group flex justify-center sm:justify-start items-center gap-2"><span class="text-zinc-500 group-hover:text-orange-400 transition-colors">Live Updates</span><span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span></a></li>
</ul>
</div>
<div class="text-center sm:text-left">
<p class="text-white font-bold uppercase tracking-widest text-sm mb-6">Contact</p>
<ul class="space-y-4">
<li><a href="mailto:info@klaxo.eu" class="flex items-center justify-center sm:justify-start gap-2"><span class="material-symbols-outlined text-orange-500 text-base shrink-0">mail</span><span class="text-zinc-500 hover:text-orange-400 transition-colors">info@klaxo.eu</span></a></li>
<li><a href="tel:+498912345678" class="flex items-center justify-center sm:justify-start gap-2"><span class="material-symbols-outlined text-orange-500 text-base shrink-0">call</span><span class="text-zinc-500 hover:text-orange-400 transition-colors">+49 89 1234 5678</span></a></li>
<li><div class="flex items-start justify-center sm:justify-start gap-2"><span class="material-symbols-outlined text-orange-500 text-base shrink-0">location_on</span><address class="text-zinc-500 not-italic flex-1">Munich, Bavaria, Germany</address></div></li>
</ul>
</div>
</div>
</div>
<div class="mt-12 border-t border-zinc-900 pt-6">
<div class="text-center sm:flex sm:justify-between sm:text-left">
<p class="text-zinc-500 text-sm italic font-['Space_Grotesk']">Driven by Adventure.</p>
<p class="text-zinc-500 text-sm mt-4 sm:mt-0 font-['Space_Grotesk']">&copy; 2024 Klaxo Car Rentals. All rights reserved.</p>
</div>
</div>
</div>
</footer>`;

const MOBILE_MENU_SCRIPT = `<script>
  (function () {
    var btn = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-menu');
    var icon = document.getElementById('mobile-menu-icon');
    if (!btn || !menu || !icon) return;
    btn.addEventListener('click', function () {
      var willOpen = menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(willOpen));
      icon.textContent = willOpen ? 'close' : 'menu';
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        icon.textContent = 'menu';
      });
    });
  })();
</script>`;

/**
 * First-party analytics snippet include (#20). Loaded from the backend origin
 * (cross-origin to GitHub Pages) so it can beacon to /api/collect.
 */
function trackScript(opts = {}) {
  const origin = (opts.analyticsOrigin || '').replace(/\/$/, '');
  if (!origin) return '';
  const slug = opts.slug ? ` data-klaxo-slug="${esc(opts.slug)}"` : '';
  return `<script defer src="${esc(origin)}/static/track.js" data-klaxo-endpoint="${esc(origin)}/api/collect"${slug}></script>`;
}

module.exports = { head, HEADER, FOOTER, MOBILE_MENU_SCRIPT, trackScript, TAILWIND_CONFIG, STYLES };
