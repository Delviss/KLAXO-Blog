/* Klaxo admin dashboard client (#19): editor + list actions. */
(function () {
  "use strict";
  var CSRF = window.KLAXO_CSRF || "";

  function api(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json", "X-CSRF-Token": CSRF }, opts.headers || {});
    opts.credentials = "same-origin";
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = { raw: t }; }
        if (!r.ok) throw Object.assign(new Error((data && data.message) || (data && data.error) || r.statusText), { status: r.status, data: data });
        return data;
      });
    });
  }

  /* ------------------------------ Articles list ------------------------------ */
  function initList() {
    var table = document.querySelector("[data-articles-table]");
    if (!table) return;
    table.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var row = btn.closest("[data-article-id]");
      var id = row.getAttribute("data-article-id");
      var action = btn.getAttribute("data-action");
      if (action === "delete" && !confirm("Delete this article? If published, it will be removed from the live site.")) return;
      if (action === "unpublish" && !confirm("Unpublish this article from the live site?")) return;

      btn.disabled = true;
      var req;
      if (action === "publish") req = api("/admin/api/articles/" + id + "/publish", { method: "POST" });
      else if (action === "unpublish") req = api("/admin/api/articles/" + id + "/unpublish", { method: "POST" });
      else if (action === "delete") req = api("/admin/api/articles/" + id, { method: "DELETE" });
      req.then(function () { location.reload(); }).catch(function (err) {
        btn.disabled = false;
        alert("Action failed: " + err.message + (err.status === 502 ? " (check GITHUB_TOKEN / publish config)" : ""));
      });
    });
  }

  /* --------------------------------- Editor --------------------------------- */
  function initEditor() {
    var root = document.querySelector("[data-editor-root]");
    if (!root) return;
    var editor = root.querySelector("[data-editor]");
    var toolbar = root.querySelector("[data-toolbar]");
    var flash = root.querySelector("[data-flash]");
    var statusPill = root.querySelector("[data-status-pill]");
    var readtimeEl = root.querySelector("[data-readtime]");
    var dataEl = document.getElementById("article-data");
    var article = null;
    try { article = JSON.parse(dataEl.textContent); } catch (e) {}
    var id = article ? article.id : null;
    var slugTouched = false;

    function field(name) { return root.querySelector('[data-field="' + name + '"]'); }
    function get(name) { var el = field(name); return el ? el.value : ""; }
    function set(name, v) { var el = field(name); if (el && v != null) el.value = v; }

    // Populate when editing.
    if (article) {
      set("title", article.title); set("slug", article.slug); set("category", article.category);
      set("excerpt", article.excerpt); set("author_name", article.author_name);
      set("hero_image_url", article.hero_image_url); set("hero_image_alt", article.hero_image_alt);
      set("read_time_minutes", article.read_time_minutes);
      set("seo_title", article.seo_title); set("seo_description", article.seo_description);
      editor.innerHTML = article.body_html || "";
      slugTouched = true;
      updateHero();
    }
    updateReadtime();

    // Auto slug from title until the user edits slug directly.
    field("slug").addEventListener("input", function () { slugTouched = true; });
    field("title").addEventListener("input", function () {
      if (!slugTouched) set("slug", slugify(get("title")));
    });
    field("hero_image_url").addEventListener("input", updateHero);

    function slugify(t) {
      return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    function updateHero() {
      var url = get("hero_image_url");
      var wrap = root.querySelector("[data-hero-preview]");
      var img = root.querySelector("[data-hero-img]");
      if (url) { img.src = url; wrap.classList.remove("hidden"); } else { wrap.classList.add("hidden"); }
    }
    function updateReadtime() {
      var words = (editor.innerText || "").trim().split(/\s+/).filter(Boolean).length;
      var mins = Math.max(1, Math.round(words / 220));
      if (readtimeEl) readtimeEl.textContent = mins;
      var rt = field("read_time_minutes");
      if (rt && !rt.value) rt.placeholder = String(mins);
    }
    editor.addEventListener("input", updateReadtime);

    // Toolbar.
    toolbar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      e.preventDefault(); editor.focus();
      var cmd = b.getAttribute("data-cmd");
      var block = b.getAttribute("data-block");
      var action = b.getAttribute("data-action");
      if (cmd) document.execCommand(cmd, false, null);
      else if (block) document.execCommand("formatBlock", false, block === "p" ? "p" : block);
      else if (action === "link") {
        var url = prompt("Link URL", "https://");
        if (url) document.execCommand("createLink", false, url);
      } else if (action === "image") {
        insertImageFlow();
      }
      updateReadtime();
    });

    function insertImageFlow() {
      var input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = function () {
        if (!input.files[0]) return;
        uploadImage(input.files[0]).then(function (url) {
          document.execCommand("insertHTML", false, '<img src="' + url + '" alt=""/>');
        }).catch(function (err) { showFlash("Image upload failed: " + err.message, true); });
      };
      input.click();
    }

    function uploadImage(file) {
      var fd = new FormData(); fd.append("file", file);
      return fetch("/admin/api/media", { method: "POST", body: fd, credentials: "same-origin", headers: { "X-CSRF-Token": CSRF } })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "upload_failed"); return d.url; }); });
    }

    // Hero upload.
    var heroUpload = root.querySelector("[data-hero-upload]");
    if (heroUpload) heroUpload.addEventListener("change", function () {
      if (!heroUpload.files[0]) return;
      uploadImage(heroUpload.files[0]).then(function (url) { set("hero_image_url", url); updateHero(); })
        .catch(function (err) { showFlash("Upload failed: " + err.message, true); });
    });

    function collect() {
      return {
        title: get("title"), slug: get("slug") || undefined, category: get("category") || undefined,
        excerpt: get("excerpt"), author_name: get("author_name") || undefined,
        hero_image_url: get("hero_image_url"), hero_image_alt: get("hero_image_alt"),
        read_time_minutes: get("read_time_minutes") ? Number(get("read_time_minutes")) : undefined,
        seo_title: get("seo_title") || undefined, seo_description: get("seo_description") || undefined,
        body_html: editor.innerHTML,
      };
    }

    function showFlash(msg, isError) {
      if (!flash) return;
      flash.textContent = msg;
      flash.className = "mb-4 rounded-lg px-4 py-3 text-sm " + (isError ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700");
      flash.classList.remove("hidden");
    }

    function save() {
      var payload = collect();
      if (!payload.title) { showFlash("Title is required.", true); return Promise.reject(new Error("no title")); }
      if (id) return api("/admin/api/articles/" + id, { method: "PUT", body: JSON.stringify(payload) });
      return api("/admin/api/articles", { method: "POST", body: JSON.stringify(payload) }).then(function (res) {
        id = res.article.id;
        history.replaceState(null, "", "/admin/articles/" + id + "/edit");
        return res;
      });
    }

    root.querySelector('[data-action="save-draft"]').addEventListener("click", function (btn) {
      var b = this; b.disabled = true;
      save().then(function () { showFlash("Draft saved."); if (statusPill) statusPill.textContent = "draft"; })
        .catch(function (err) { showFlash("Save failed: " + err.message, true); })
        .finally(function () { b.disabled = false; });
    });

    root.querySelector('[data-action="publish"]').addEventListener("click", function () {
      var b = this; b.disabled = true;
      showFlash("Publishing… generating HTML and committing to the site.");
      save().then(function () { return api("/admin/api/articles/" + id + "/publish", { method: "POST" }); })
        .then(function (res) {
          showFlash("Published! Live on GitHub Pages within ~1 minute.");
          if (statusPill) { statusPill.textContent = "published"; statusPill.className = "text-xs font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-700"; }
        })
        .catch(function (err) { showFlash("Publish failed: " + err.message + " — draft was saved; retry from the list.", true); })
        .finally(function () { b.disabled = false; });
    });

    root.querySelector('[data-action="preview"]').addEventListener("click", function () {
      var b = this; b.disabled = true;
      var w = window.open("", "klaxo-preview");
      // Preview returns raw HTML (not JSON), so fetch the text directly.
      fetch("/admin/api/articles/preview", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF }, body: JSON.stringify(collect()) })
        .then(function (r) { return r.text(); })
        .then(function (html) { if (w) { w.document.open(); w.document.write(html); w.document.close(); } })
        .catch(function (err) { if (w) w.close(); alert("Preview failed: " + err.message); })
        .finally(function () { b.disabled = false; });
    });

    // Warn on unsaved changes.
    var dirty = false;
    root.addEventListener("input", function () { dirty = true; }, true);
    editor.addEventListener("input", function () { dirty = true; });
    window.addEventListener("beforeunload", function (e) {
      if (!dirty) return; e.preventDefault(); e.returnValue = "";
    });
    root.querySelectorAll('[data-action="save-draft"],[data-action="publish"]').forEach(function (b) {
      b.addEventListener("click", function () { dirty = false; });
    });
  }

  document.addEventListener("DOMContentLoaded", function () { initList(); initEditor(); });
})();
