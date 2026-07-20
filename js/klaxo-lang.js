/*
 * Klaxo Blog — language switcher (globe icon).
 *
 * Adds the globe / language control to the header on every page and swaps the
 * site between English and German. It injects the button + menu (so no header
 * markup has to change), remembers the choice in localStorage, sets
 * <html lang>, and translates the shared chrome (both header variants, both
 * footers, the mobile menus and the saved-list drawer) plus the homepage's
 * editorial content. Article body prose stays in its original language.
 *
 * Translation is exact-match only: a string is swapped just when it appears in
 * the dictionary below, so it is safe to run over whole sections — anything
 * not listed is left untouched.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var LS_LANG = "klaxo-lang";
  var LANGS = ["en", "de"];
  var LABELS = { en: "English", de: "Deutsch" };

  // English source string -> German.
  var DE = {
    /* ---- Header / nav (both header variants) ---- */
    "Travel Tips": "Reisetipps",
    "Destinations": "Reiseziele",
    "Fleet": "Fuhrpark",
    "Reviews": "Bewertungen",
    "About": "Über uns",
    "Discover": "Entdecken",
    "Explore the Fleet": "Fuhrpark entdecken",
    "Journal": "Journal",
    "Rent Now": "Jetzt mieten",
    "Rent a Car": "Auto mieten",
    "Rent a car": "Auto mieten",
    "Search for a place or guide": "Ort oder Guide suchen",

    /* ---- Saved-list drawer / favorites (homepage) ---- */
    "Your saved list": "Deine Merkliste",
    "Nothing saved yet.": "Noch nichts gespeichert.",
    "Tap the heart on any article to keep it here.": "Tippe bei einem Artikel auf das Herz, um ihn hier zu behalten.",
    "Book on klaxo.eu": "Auf klaxo.eu buchen",

    /* ---- Footer (both variants) ---- */
    "Navigation": "Navigation",
    "Fleet Guide": "Fuhrpark-Guide",
    "Travel Blog": "Reiseblog",
    "Support": "Hilfe",
    "Contact": "Kontakt",
    "Privacy Policy": "Datenschutz",
    "Terms of Service": "AGB",
    "Help Center": "Hilfe-Center",
    "Munich, Bavaria, Germany": "München, Bayern, Deutschland",
    "Defining the next generation of premium car rentals and travel experiences across Europe. An editorial companion to": "Wir definieren die nächste Generation von Premium-Autovermietung und Reiseerlebnissen in ganz Europa. Ein redaktioneller Begleiter zu",
    "Defining the next generation of premium car rentals and travel experiences across Europe. A backlink blog by": "Wir definieren die nächste Generation von Premium-Autovermietung und Reiseerlebnissen in ganz Europa. Ein Backlink-Blog von",
    "Driven by adventure.": "Angetrieben von Abenteuer.",
    "Driven by Adventure.": "Angetrieben von Abenteuer.",
    "© 2026 Klaxo Car Rentals. All rights reserved.": "© 2026 Klaxo Car Rentals. Alle Rechte vorbehalten.",
    "© 2024 Klaxo Car Rentals. All rights reserved.": "© 2024 Klaxo Car Rentals. Alle Rechte vorbehalten.",

    /* ---- Homepage: hero ---- */
    "The Klaxo Travel Tips Blog": "Der Klaxo Reisetipps-Blog",
    "Stories from": "Geschichten von",
    "the road,": "der Straße,",
    "fueled": "angetrieben",
    "by Klaxo.": "von Klaxo.",
    "Practical guides for renting, driving and exploring across Munich, Bavaria, Austria and Switzerland — routes we drive before we recommend, written by the team at": "Praktische Guides zum Mieten, Fahren und Entdecken in München, Bayern, Österreich und der Schweiz – Routen, die wir fahren, bevor wir sie empfehlen, geschrieben vom Team von",
    "Read the guides": "Zu den Guides",
    "Book a car": "Auto buchen",
    "Latest · Day Trips": "Neu · Tagesausflüge",

    /* ---- Homepage: articles section ---- */
    "All Articles": "Alle Artikel",
    "Travel tips & driving guides": "Reisetipps & Fahr-Guides",
    "All": "Alle",
    "Day Trips": "Tagesausflüge",
    "Coastal Drives": "Küstenstraßen",
    "Alpine Transfers": "Alpentransfers",
    "Group Travel": "Gruppenreisen",
    "Sustainable": "Nachhaltig",
    "Sustainable Mobility": "Nachhaltige Mobilität",

    /* ---- Homepage: article cards (titles / summaries) ---- */
    "Top 5 Hidden Coastal Drives in Bavaria": "Die 5 schönsten versteckten Küstenstraßen in Bayern",
    "Lakeside routes that rival the Mediterranean — Tegernsee, Chiemsee, Walchensee and more, with the best Klaxo car for each shoreline.": "Seenrouten, die es mit dem Mittelmeer aufnehmen – Tegernsee, Chiemsee, Walchensee und mehr, mit dem passenden Klaxo-Wagen für jedes Ufer.",
    "5 Fairytale Day Trips from Munich You Can't Miss": "5 märchenhafte Tagesausflüge ab München, die du nicht verpassen darfst",
    "Neuschwanstein, Salzburg, Hallstatt, Rothenburg and Linderhof — with the right Klaxo car for each.": "Neuschwanstein, Salzburg, Hallstatt, Rothenburg und Linderhof – mit dem passenden Klaxo-Wagen für jeden.",
    "V-Class Rentals: Luxury & Group Travel in Munich": "V-Class mieten: Luxus & Gruppenreisen in München",
    "Seamless Alpine Transfers: Munich to Austria & Switzerland": "Nahtlose Alpentransfers: München nach Österreich & in die Schweiz",
    "Hybrid & Electric Rentals: Sustainable Mobility in Bavaria": "Hybrid- & Elektromietwagen: Nachhaltige Mobilität in Bayern",
    "Driven before it's recommended.": "Gefahren, bevor wir es empfehlen.",
    "An editorial companion to klaxo.eu. Every route in these guides is driven by our team, and every rental tip reflects our real fleet.": "Ein redaktioneller Begleiter zu klaxo.eu. Jede Route in diesen Guides wird von unserem Team gefahren, und jeder Miettipp spiegelt unsere echte Flotte wider.",
    "About this blog": "Über diesen Blog",
    "10 min read": "10 Min. Lesezeit",
    "12 min": "12 Min.",
    "11 min": "11 Min.",
    "10 min": "10 Min.",
    "9 min": "9 Min.",

    /* ---- Homepage: gallery ---- */
    "The Klaxo Gallery": "Die Klaxo-Galerie",
    "Postcards from the road": "Postkarten von unterwegs",
    "Bavaria through our windshield": "Bayern durch unsere Windschutzscheibe",
    "Scroll down! 👇": "Nach unten scrollen! 👇",

    /* ---- Homepage: fleet / reviews / CTA / gift / newsletter ---- */
    "The Klaxo Fleet": "Die Klaxo-Flotte",
    "Driven, tested and recommended": "Gefahren, getestet und empfohlen",
    "Guests & Memories": "Gäste & Erinnerungen",
    "Rated by the people we drive": "Bewertet von den Menschen, die wir fahren",
    "Ready for your own story?": "Bereit für deine eigene Geschichte?",
    "See these roads for yourself": "Erlebe diese Straßen selbst",
    "New · Klaxo Gift Vouchers": "Neu · Klaxo-Gutscheine",
    "Live Updates": "Live-Updates",
    "New routes, straight to your inbox": "Neue Routen, direkt in dein Postfach",
    "One email when a new guide is published. No noise, no spam — just the road.": "Eine E-Mail, sobald ein neuer Guide erscheint. Kein Lärm, kein Spam – nur die Straße.",
    "Subscribe on klaxo.eu": "Auf klaxo.eu abonnieren"
  };
  var DICT = { en: {}, de: DE };

  /* -------------------------------------------------- */
  /* Helpers                                            */
  /* -------------------------------------------------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function getLang() {
    var l;
    try { l = localStorage.getItem(LS_LANG); } catch (e) { l = null; }
    return LANGS.indexOf(l) !== -1 ? l : "en";
  }

  /* -------------------------------------------------- */
  /* Styles + injected control                          */
  /* -------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById("klaxo-lang-styles")) return;
    var css = [
      ".klaxo-lang-wrap{position:relative;display:inline-flex}",
      ".klaxo-lang-btn{display:inline-flex;align-items:center;justify-content:center;gap:2px;width:40px;height:40px;border-radius:9999px;border:1px solid rgba(0,0,0,.12);background:transparent;color:#3f3f46;cursor:pointer;transition:color .2s,border-color .2s,background .2s;padding:0}",
      ".klaxo-lang-btn:hover{color:#ff8c00;border-color:#ff8c00}",
      ".klaxo-lang-btn .material-symbols-outlined{font-size:22px;line-height:1}",
      ".klaxo-lang-btn .klaxo-lang-code{font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:.02em}",
      ".klaxo-lang-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:172px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 12px 32px -8px rgba(0,0,0,.28);padding:6px;z-index:80;animation:klaxoLangPop .16s ease-out}",
      ".klaxo-lang-menu[hidden]{display:none}",
      ".klaxo-lang-title{padding:6px 10px 4px;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#a1a1aa}",
      ".klaxo-lang-opt{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:none;background:transparent;border-radius:8px;font-size:14px;color:#27272a;cursor:pointer;text-align:left}",
      ".klaxo-lang-opt:hover{background:#f4f4f5}",
      ".klaxo-lang-opt .klaxo-lang-check{color:#ff8c00;font-size:18px;visibility:hidden}",
      ".klaxo-lang-opt.is-active .klaxo-lang-check{visibility:visible}",
      ".klaxo-lang-opt.is-active{font-weight:600}",
      "@keyframes klaxoLangPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}"
    ].join("");
    var s = document.createElement("style");
    s.id = "klaxo-lang-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildControl() {
    var header = document.querySelector("header");
    if (!header || header.querySelector(".klaxo-lang-wrap")) return;
    var anchor = header.querySelector("#wishlistBtn")
      || header.querySelector("#mobile-menu-btn")
      || header.querySelector("#menuBtn");
    if (!anchor || !anchor.parentElement) return;

    var wrap = document.createElement("div");
    wrap.className = "klaxo-lang-wrap";
    wrap.innerHTML =
      '<button type="button" class="klaxo-lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Change language" title="Change language">' +
        '<span class="material-symbols-outlined">language</span>' +
        '<span class="klaxo-lang-code"></span>' +
      '</button>' +
      '<div class="klaxo-lang-menu" hidden role="menu">' +
        '<p class="klaxo-lang-title">Language</p>' +
        LANGS.map(function (code) {
          return '<button type="button" class="klaxo-lang-opt" data-lang="' + code + '" role="menuitemradio">' +
            '<span>' + LABELS[code] + '</span>' +
            '<span class="material-symbols-outlined klaxo-lang-check">check</span>' +
          '</button>';
        }).join("") +
      '</div>';
    anchor.parentElement.insertBefore(wrap, anchor);

    var btn = wrap.querySelector(".klaxo-lang-btn");
    var menu = wrap.querySelector(".klaxo-lang-menu");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hasAttribute("hidden");
      if (open) { menu.removeAttribute("hidden"); btn.setAttribute("aria-expanded", "true"); }
      else { menu.setAttribute("hidden", ""); btn.setAttribute("aria-expanded", "false"); }
    });
    wrap.querySelectorAll("[data-lang]").forEach(function (opt) {
      opt.addEventListener("click", function () {
        setLang(opt.getAttribute("data-lang"));
        menu.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) { menu.setAttribute("hidden", ""); btn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) { menu.setAttribute("hidden", ""); btn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* -------------------------------------------------- */
  /* Translation                                        */
  /* -------------------------------------------------- */
  var ORIG = typeof WeakMap === "function" ? new WeakMap() : null;
  var origList = [];
  function getOrig(node) {
    if (ORIG) {
      var v = ORIG.get(node);
      if (v === undefined) { v = node.nodeValue; ORIG.set(node, v); }
      return v;
    }
    for (var i = 0; i < origList.length; i++) if (origList[i].n === node) return origList[i].v;
    origList.push({ n: node, v: node.nodeValue });
    return node.nodeValue;
  }

  function translateScopes(lang) {
    var roots = document.querySelectorAll("header, footer, [data-i18n-scope]");
    Array.prototype.forEach.call(roots, function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var node, nodes = [];
      while ((node = walker.nextNode())) nodes.push(node);
      nodes.forEach(function (n) {
        if (n.parentElement && n.parentElement.closest(".klaxo-lang-wrap")) return; // our own control
        var raw = n.nodeValue;
        if (!raw || !raw.trim()) return;
        var orig = getOrig(n);
        var trimmed = orig.trim();
        if (lang === "en") {
          if (n.nodeValue !== orig) n.nodeValue = orig;
          return;
        }
        var translated = DICT[lang][trimmed];
        if (translated != null) {
          var lead = orig.match(/^\s*/)[0];
          var trail = orig.match(/\s*$/)[0];
          n.nodeValue = lead + translated + trail;
        } else if (n.nodeValue !== orig) {
          n.nodeValue = orig;
        }
      });
    });
  }

  function translateAttributes(lang) {
    var input = document.querySelector('header input[type="search"]');
    if (input) {
      if (!input.getAttribute("data-i18n-ph")) input.setAttribute("data-i18n-ph", input.getAttribute("placeholder") || "");
      var ph = input.getAttribute("data-i18n-ph");
      input.setAttribute("placeholder", lang === "en" ? ph : (DICT[lang][ph] || ph));
    }
  }

  function updateControl(lang) {
    var code = document.querySelector(".klaxo-lang-btn .klaxo-lang-code");
    if (code) code.textContent = lang.toUpperCase();
    Array.prototype.forEach.call(document.querySelectorAll(".klaxo-lang-opt"), function (opt) {
      var on = opt.getAttribute("data-lang") === lang;
      opt.classList.toggle("is-active", on);
      opt.setAttribute("aria-checked", String(on));
    });
    var title = document.querySelector(".klaxo-lang-title");
    if (title) title.textContent = lang === "de" ? "Sprache" : "Language";
  }

  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    translateScopes(lang);
    translateAttributes(lang);
    updateControl(lang);
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem(LS_LANG, lang); } catch (e) {}
    applyLang(lang);
  }

  /* -------------------------------------------------- */
  /* Init                                               */
  /* -------------------------------------------------- */
  ready(function () {
    injectStyles();
    buildControl();
    applyLang(getLang());
    window.addEventListener("storage", function (e) {
      if (e.key === LS_LANG) applyLang(getLang());
    });
  });
})();
