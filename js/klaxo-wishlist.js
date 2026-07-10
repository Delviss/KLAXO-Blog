/*
 * Klaxo Blog — portable "saved list" (wishlist) for pages other than the
 * homepage.
 *
 * The homepage (index.html) owns the wishlist hearts + drawer inline. Article
 * and info pages don't carry that markup, so this script gives their header
 * "Saved" button a working drawer that reads the SAME localStorage key
 * ("klaxo-wishlist"). Whatever you save from the homepage shows up here, and
 * removals here are reflected back — one shared list, always in sync.
 *
 * Wiring on a page:
 *   - Any element with [data-wishlist-open] opens the drawer.
 *   - Any element with [data-wishlist-count] gets the live saved count.
 * The drawer + overlay are injected into <body>; styles are self-contained so
 * the look is identical regardless of each page's Tailwind config.
 */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // If the homepage's own wishlist drawer is present, that page manages itself.
  if (document.getElementById("wishlistDrawer")) return;

  var KEY = "klaxo-wishlist";

  // Friendly titles for the known guides (matches the homepage cards).
  var TITLES = {
    "coastal-drives": "Top 5 Hidden Coastal Drives in Bavaria",
    "day-trips-from-munich": "5 Fairytale Day Trips from Munich You Can't Miss",
    "v-class-group-travel": "V-Class Rentals: Luxury & Group Travel in Munich",
    "alpine-transfers": "Seamless Alpine Transfers: Munich to Austria & Switzerland",
    "sustainable-mobility": "Hybrid & Electric Rentals: Sustainable Mobility in Bavaria"
  };
  function titleFor(id) {
    if (TITLES[id]) return TITLES[id];
    return id.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* -------- storage (degrades to memory in sandboxed previews) -------- */
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };
  function readList() { try { return JSON.parse(store.get(KEY)) || []; } catch (e) { return []; } }
  function writeList(l) { store.set(KEY, JSON.stringify(l)); }

  /* -------- styles -------- */
  function injectStyles() {
    if (document.getElementById("klaxo-wishlist-styles")) return;
    var css =
      "#klxWishOverlay{position:fixed;inset:0;z-index:60;background:rgba(26,18,12,.5);opacity:0;visibility:hidden;transition:opacity .3s}" +
      "#klxWishOverlay.open{opacity:1;visibility:visible}" +
      "#klxWishDrawer{position:fixed;top:0;right:0;z-index:70;height:100%;width:100%;max-width:24rem;background:#fff8f5;" +
      "box-shadow:0 25px 50px -12px rgba(0,0,0,.4);transform:translateX(100%);transition:transform .3s;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif}" +
      "#klxWishDrawer.open{transform:translateX(0)}" +
      ".klx-wh-head{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(221,193,174,.6)}" +
      ".klx-wh-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;color:#241912;display:inline-flex;align-items:center;gap:8px}" +
      ".klx-wh-title .material-symbols-outlined{color:#ff8c00;font-variation-settings:'FILL' 1}" +
      ".klx-wh-close{display:grid;place-items:center;width:36px;height:36px;border-radius:9999px;border:0;background:transparent;color:#241912;cursor:pointer}" +
      ".klx-wh-close:hover{background:#fff1e9}" +
      ".klx-wh-items{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px}" +
      ".klx-wh-empty{text-align:center;color:#564334;font-size:14px;padding:48px 8px}" +
      ".klx-wh-empty .material-symbols-outlined{font-size:40px;color:#ddc1ae;display:block;margin:0 auto 12px}" +
      ".klx-wh-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(221,193,174,.7);" +
      "background:#fff;border-radius:12px;padding:16px}" +
      ".klx-wh-row a{font-size:14px;font-weight:700;line-height:1.35;color:#241912;text-decoration:none;font-family:'Space Grotesk',sans-serif}" +
      ".klx-wh-row a:hover{color:#904d00}" +
      ".klx-wh-rm{display:grid;place-items:center;width:32px;height:32px;border-radius:9999px;border:0;background:transparent;color:#897362;cursor:pointer;flex:none}" +
      ".klx-wh-rm:hover{background:#fff1e9;color:#ff8c00}" +
      ".klx-wh-foot{padding:20px;border-top:1px solid rgba(221,193,174,.6)}" +
      ".klx-wh-book{display:inline-flex;justify-content:center;align-items:center;gap:8px;width:100%;background:#ff8c00;color:#fff;" +
      "font-weight:700;padding:12px 24px;border-radius:9999px;text-decoration:none;transition:filter .2s}" +
      ".klx-wh-book:hover{filter:brightness(1.08)}" +
      ".klx-wh-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9999px;" +
      "background:#ff8c00;color:#fff;font-size:10px;font-weight:700;line-height:18px;text-align:center}" +
      ".klx-wh-badge.klx-hidden{display:none}";
    var s = document.createElement("style");
    s.id = "klaxo-wishlist-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* -------- drawer markup -------- */
  var drawer, overlay, itemsEl;
  function buildDrawer() {
    overlay = document.createElement("div");
    overlay.id = "klxWishOverlay";

    drawer = document.createElement("aside");
    drawer.id = "klxWishDrawer";
    drawer.setAttribute("aria-label", "Saved guides");
    drawer.setAttribute("data-i18n-scope", "");
    drawer.innerHTML =
      '<div class="klx-wh-head">' +
        '<h3 class="klx-wh-title"><span class="material-symbols-outlined">favorite</span>Your saved list</h3>' +
        '<button type="button" class="klx-wh-close" aria-label="Close"><span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<div class="klx-wh-items" id="klxWishItems"></div>' +
      '<div class="klx-wh-foot">' +
        '<a class="klx-wh-book" href="https://www.klaxo.eu/packages">Book on klaxo.eu <span class="material-symbols-outlined" style="font-size:18px">arrow_outward</span></a>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    itemsEl = drawer.querySelector("#klxWishItems");

    drawer.querySelector(".klx-wh-close").addEventListener("click", function () { openDrawer(false); });
    overlay.addEventListener("click", function () { openDrawer(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") openDrawer(false); });
  }

  function openDrawer(open) {
    if (open) refresh();
    drawer.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  /* -------- render -------- */
  function updateCounts() {
    var n = readList().length;
    var badges = document.querySelectorAll("[data-wishlist-count]");
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = n;
      badges[i].classList.toggle("klx-hidden", n === 0);
    }
  }

  function refresh() {
    updateCounts();
    if (!itemsEl) return;
    var list = readList();
    if (!list.length) {
      itemsEl.innerHTML = '<div class="klx-wh-empty"><span class="material-symbols-outlined">favorite</span>' +
        "Nothing saved yet.<br/>Tap the heart on any article to keep it here.</div>";
      return;
    }
    while (itemsEl.firstChild) itemsEl.removeChild(itemsEl.firstChild);
    list.forEach(function (id) {
      var row = document.createElement("div");
      row.className = "klx-wh-row";
      var a = document.createElement("a");
      a.href = id + ".html";
      a.textContent = titleFor(id);
      row.appendChild(a);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "klx-wh-rm";
      rm.setAttribute("aria-label", "Remove");
      rm.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">close</span>';
      rm.addEventListener("click", function () {
        writeList(readList().filter(function (x) { return x !== id; }));
        refresh();
      });
      row.appendChild(rm);
      itemsEl.appendChild(row);
    });
  }

  /* -------- init -------- */
  function init() {
    injectStyles();
    buildDrawer();
    var openers = document.querySelectorAll("[data-wishlist-open]");
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener("click", function (e) { e.preventDefault(); openDrawer(true); });
    }
    updateCounts();
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) { updateCounts(); if (drawer && drawer.classList.contains("open")) refresh(); }
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
