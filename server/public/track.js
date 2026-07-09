/*!
 * Klaxo first-party analytics (#20). Tiny, no dependencies, no cookies.
 * Sends pageviews automatically and click events for CTAs / outbound links.
 * Configure via the loading <script> tag:
 *   <script defer src=".../track.js" data-klaxo-endpoint=".../api/collect" data-klaxo-slug="coastal-drives"></script>
 * Public API: window.klaxo.track('click', { target:'rent-now', href:'…' })
 */
(function () {
  "use strict";
  var s =
    document.currentScript ||
    (function () {
      var els = document.getElementsByTagName("script");
      for (var i = els.length - 1; i >= 0; i--) {
        if (els[i].src && els[i].src.indexOf("track.js") !== -1) return els[i];
      }
      return null;
    })();
  if (!s) return;

  var ENDPOINT = s.getAttribute("data-klaxo-endpoint");
  var SLUG = s.getAttribute("data-klaxo-slug") || null;
  if (!ENDPOINT) return;

  function sessionId() {
    try {
      var k = "klaxo_sid";
      var v = sessionStorage.getItem(k);
      if (!v) {
        v = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) {
      return null;
    }
  }

  function utms() {
    var q = {};
    try {
      var p = new URLSearchParams(location.search);
      ["source", "medium", "campaign"].forEach(function (k) {
        var val = p.get("utm_" + k);
        if (val) q["utm_" + k] = val.slice(0, 200);
      });
    } catch (e) {}
    return q;
  }

  function send(payload) {
    payload.path = location.pathname + location.search;
    payload.referrer = document.referrer || null;
    payload.slug = SLUG;
    payload.session_id = sessionId();
    var u = utms();
    for (var k in u) payload[k] = u[k];
    var body = JSON.stringify(payload);
    try {
      // text/plain avoids a CORS preflight; the collector parses the JSON string.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
        return;
      }
    } catch (e) {}
    try {
      fetch(ENDPOINT, { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" }, mode: "cors" });
    } catch (e) {}
  }

  function track(type, meta) {
    send({ event_type: type || "custom", meta: meta || null });
  }

  // Auto pageview.
  send({ event_type: "pageview" });

  // Auto-instrument clicks: explicit [data-klaxo-track] + outbound klaxo.eu links.
  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button,[data-klaxo-track]") : null;
      if (!el) return;
      var label = el.getAttribute("data-klaxo-track");
      var href = el.getAttribute("href") || null;
      var outbound = href && /klaxo\.eu/i.test(href);
      if (!label && !outbound) return;
      track("click", {
        target: label || "outbound",
        href: href,
        label: (el.textContent || "").trim().slice(0, 80) || null,
      });
    },
    true
  );

  window.klaxo = { track: track };
})();
