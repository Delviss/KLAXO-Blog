/*
 * Klaxo Blog – HeroScrub-inspired interactive animations.
 *
 * Adapts the spirit of the React `HeroScrub` component (cinematic
 * scroll-scrubbed hero, title split, reveal-on-scroll, parallax) to the
 * static HTML site using GSAP + ScrollTrigger over CDN. Blog copy and
 * structure are untouched – elements are decorated via classes/data attrs.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn("[klaxo-anim] GSAP or ScrollTrigger not loaded; animations disabled.");
      return;
    }
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      // Honour reduced-motion: still run the live scroll-progress bar (low cost),
      // skip every transform/opacity choreography.
      initScrollProgress();
      return;
    }

    initScrollProgress();
    initHeroScrub();
    initSectionReveals();
    initRelatedCardsStagger();
    initMagneticButtons();
  });

  /* -------------------------------------------------- */
  /* Scroll progress bar                                */
  /* -------------------------------------------------- */
  function initScrollProgress() {
    const fill = document.querySelector("[data-scroll-progress]");
    if (!fill) return;

    const update = function () {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = (doc.scrollHeight || 0) - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
      fill.style.width = pct.toFixed(2) + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* -------------------------------------------------- */
  /* Hero scrub – title split + image immerse on scroll */
  /* -------------------------------------------------- */
  function initHeroScrub() {
    const gsap = window.gsap;
    const hero = document.querySelector("[data-hero-scrub]");
    if (!hero) return;

    const image = hero.querySelector("[data-hero-image]");
    const card = hero.querySelector("[data-hero-card]");
    const titleTop = hero.querySelector("[data-hero-title-top]");
    const titleBottom = hero.querySelector("[data-hero-title-bottom]");
    const overlay = hero.querySelector("[data-hero-overlay]");

    // Entry timeline – mirrors the HeroScrub `ENTRY_DELAY` opener.
    const entry = gsap.timeline({ delay: 0.15 });
    if (image) entry.from(image, { opacity: 0, scale: 1.08, duration: 1.4, ease: "power2.out" }, 0);
    if (card) entry.from(card, { opacity: 0, duration: 1.1, ease: "power3.out" }, 0.2);
    if (titleTop) entry.from(titleTop, { opacity: 0, y: 30, duration: 1, ease: "expo.out" }, 0.35);
    if (titleBottom) entry.from(titleBottom, { opacity: 0, y: -30, duration: 1, ease: "expo.out" }, 0.45);

    // Scroll-driven choreography across the hero section.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });

    if (titleTop) {
      tl.to(titleTop, {
        x: function () { return window.innerWidth < 768 ? "-60vw" : "-45vw"; },
        letterSpacing: "0.04em",
        ease: "power2.inOut",
      }, 0);
      tl.to(titleTop, { opacity: 0, ease: "power1.in", duration: 0.4 }, 0.5);
    }
    if (titleBottom) {
      tl.to(titleBottom, {
        x: function () { return window.innerWidth < 768 ? "60vw" : "45vw"; },
        letterSpacing: "0.04em",
        ease: "power2.inOut",
      }, 0);
      tl.to(titleBottom, { opacity: 0, ease: "power1.in", duration: 0.4 }, 0.5);
    }
    if (image) {
      tl.to(image, { scale: 1.18, ease: "power2.in" }, 0);
    }
    if (overlay) {
      tl.to(overlay, { opacity: 1, ease: "power1.in" }, 0);
    }
  }

  /* -------------------------------------------------- */
  /* Section reveals – headings, paragraphs, callouts   */
  /* -------------------------------------------------- */
  function initSectionReveals() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    // Below-the-fold .animate-reveal elements: re-run with ScrollTrigger so they
    // animate in as they enter the viewport rather than all at page-load.
    const reveals = document.querySelectorAll("[data-reveal], main .animate-reveal, article .animate-reveal");
    reveals.forEach(function (el) {
      // Skip elements already above-the-fold to keep the first-paint feel.
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Staggered paragraph fade-in inside the article body.
    const paragraphs = document.querySelectorAll("article .prose > p, article .prose > h2, article .prose > h3");
    paragraphs.forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }
          );
        },
      });
    });
  }

  /* -------------------------------------------------- */
  /* Related-articles stagger entrance                  */
  /* -------------------------------------------------- */
  function initRelatedCardsStagger() {
    const gsap = window.gsap;
    const grid = document.querySelector("[data-related-grid]");
    if (!grid) return;
    const cards = grid.children;
    if (!cards || !cards.length) return;

    gsap.from(cards, {
      opacity: 0,
      y: 60,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: grid,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  }

  /* -------------------------------------------------- */
  /* Magnetic / lift effect on primary CTA buttons      */
  /* -------------------------------------------------- */
  function initMagneticButtons() {
    const gsap = window.gsap;
    const buttons = document.querySelectorAll(".btn-premium-transition");
    buttons.forEach(function (btn) {
      const strength = 14;
      btn.addEventListener("mousemove", function (e) {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
          x: (relX / rect.width) * strength,
          y: (relY / rect.height) * strength,
          duration: 0.25,
          ease: "power3.out",
        });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.5)" });
      });
    });
  }
})();
