# Klaxo Blog — Dashboard & Backend

Admin **dashboard + backend** for the Klaxo Travel Tips blog: first-party
analytics, no-code publishing, and secure admin login. Implements the
[Blog Dashboard & Backend on Railway epic](../../../issues/23) (#15–#22).

The **public blog stays static on GitHub Pages** (the repo root `index.html`
and `*.html` pages, deployed by `.github/workflows/pages.yml`). This backend is
a **separate Node service** that:

1. Lets an admin write articles in a WYSIWYG dashboard (no hand-editing HTML).
2. On publish, **generates each article's HTML** from the same Tailwind/markup
   as the existing pages and **commits it to this repo via the GitHub API** — a
   single commit that also regenerates `index.html` + `sitemap.xml`. GitHub Pages
   redeploys and the post is live ~1 minute later.
3. Collects **first-party analytics** (pageviews, clicks, visitors) into its own
   Postgres and shows them natively in the dashboard.

```
Admin ──▶ Dashboard (this app) ──▶ GitHub API commit ──▶ Pages workflow ──▶ blog.klaxo.eu
                │                                                              │
Postgres ◀──────┘  articles + sessions + analytics          track.js beacons ─┘
```

---

## Architecture

| Concern | Choice |
|---|---|
| Runtime | Node.js ≥ 20, Express |
| Database | PostgreSQL (`pg` pool), migrations via `node-pg-migrate` |
| Auth | Session-based (bcrypt), sessions stored in Postgres (`connect-pg-simple`), CSRF-protected |
| Views | Server-rendered EJS + a small vanilla-JS editor layer |
| Publishing | `@octokit/rest`, Git Trees API (one commit per publish) |
| Analytics | First-party `track.js` beacon → `POST /api/collect` → Postgres |
| Hosting | Railway (web service + managed Postgres) |

### Folder layout

```
server/
├── src/
│   ├── app.js            Express app factory (routes, middleware)
│   ├── server.js         entrypoint (listen + graceful shutdown)
│   ├── config.js         env-driven config (validated in prod)
│   ├── db/               pool + query modules (users, articles, analytics)
│   ├── middleware/       auth, csrf, rate limiting, helmet
│   ├── routes/           auth, admin CRUD API, media, dashboard, analytics, public API, collector
│   ├── services/         slug, read-time, sanitize, UA, renderers, GitHub publish
│   └── views/            EJS templates (login, dashboard, editor, analytics)
├── public/               track.js (tracking snippet) + admin.js (dashboard client)
├── migrations/           node-pg-migrate migrations
├── bin/                  create-admin, seed-articles, purge-analytics CLIs
└── test/                 unit tests (node:test)
```

---

## Local development

```bash
cd server
cp .env.example .env          # then edit values
npm install
createdb klaxo_blog           # or point DATABASE_URL at any Postgres
npm run migrate               # apply schema
npm run create-admin          # prompts for email + password (min 10 chars)
npm run seed:articles         # import the 6 existing articles into the CMS
npm run dev                   # http://localhost:3000/admin
```

`GET /health` → `{ "status": "ok", "db": "connected" }`.

Run the tests:

```bash
npm test
```

---

## Environment variables

See [`.env.example`](./.env.example). Required in production:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (Railway injects it). Set `DATABASE_SSL=true` for managed PG. |
| `SESSION_SECRET` | Long random string for session signing. |
| `ANALYTICS_SALT` | Long random string for the daily visitor hash. |
| `GITHUB_TOKEN` | **Least-privilege** token/App with `contents:write` on this repo **only**. |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` | Publish target (default `Delviss` / `KLAXO-Blog` / `main`). |
| `SITE_BASE_URL` | Public base URL of the static site (for canonical URLs + sitemap). |
| `APP_URL` | Public URL of **this** backend (used by `track.js` and cookies). |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to POST to `/api/collect`. |

The app **refuses to start in production** if `SESSION_SECRET` / `ANALYTICS_SALT`
are missing or left at their insecure dev defaults.

---

## Deploying to Railway

1. Create a Railway project. Add a **PostgreSQL** plugin (injects `DATABASE_URL`).
2. Add a **web service** from this repo, root directory `server/`.
   `railway.json` sets the start command to `npm run migrate && npm start` and a
   `/health` healthcheck — migrations run on every deploy (idempotent).
3. Set the environment variables above in the service settings.
4. (Optional) Mount a **Railway volume** at `server/uploads` so uploaded images
   persist across deploys — or switch `routes/adminMedia.js` to S3/Cloudflare R2.
5. First deploy: open a shell and run `npm run create-admin`, then
   `npm run seed:articles` once to import existing content.

### GitHub token (least privilege)

Prefer a **GitHub App** (or fine-grained PAT) scoped to **only this repo** with
**Contents: Read and write**. Store it as the `GITHUB_TOKEN` Railway secret.
Nothing else is needed — the pipeline only reads/writes files on `main`.

---

## How publishing works (#18)

- **Publish / update** → renders `<slug>.html` + regenerates `index.html` +
  `sitemap.xml`, committed together in one commit via the Git Trees API.
- **Unpublish / delete** → removes `<slug>.html` and re-renders the homepage in
  one commit; the DB row is dropped on delete.
- Failures are captured: the article's `publish_state` becomes `publish_failed`
  with the error surfaced in the dashboard, and a **retry** re-runs the publish.
- Generated pages reuse the exact Tailwind config, header, footer, animations
  (`js/animations.js`) and hero/prose markup of the existing hand-written pages,
  plus the first-party analytics snippet.

## How analytics works (#20/#21)

- `public/track.js` (< 2 KB, no deps) is injected into every generated page. It
  sends a `pageview` on load and `click` events for CTAs / outbound `klaxo.eu`
  links (any element with `data-klaxo-track`, plus outbound links automatically).
  Expose custom events via `window.klaxo.track('click', { target, href })`.
- `POST /api/collect` validates + stores events, is CORS-restricted to
  `ALLOWED_ORIGINS`, rate-limited, and **drops bots**. Unique visitors are
  counted with a **daily-rotating salted hash of IP+UA** — no raw IP is stored.
- The dashboard aggregates by date range (today / 7d / 30d / 90d / custom):
  KPIs with trend vs the previous period, a traffic time-series, top articles,
  traffic sources, device/browser/OS/country, top clicks, and a CSV export.

---

## Operations runbook

**Create/reset an admin**

```bash
npm run create-admin -- --email you@klaxo.eu --password '••••••••••'
```

**Import existing articles** (idempotent, upsert by slug)

```bash
npm run seed:articles            # as published
npm run seed:articles -- --draft # as drafts
```

**Analytics retention** (schedule as a Railway cron)

```bash
node bin/purge-analytics.js 400  # delete events older than 400 days
```

**Postgres backups**

- Enable Railway's automated Postgres backups, **or** schedule
  `pg_dump "$DATABASE_URL" > backup.sql`.
- Restore with `psql "$DATABASE_URL" < backup.sql`. The static site is fully
  reproducible from the DB — republish from the dashboard after a restore.

**Rotate the GitHub token** — issue a new least-privilege token, update the
`GITHUB_TOKEN` Railway secret, redeploy, and revoke the old one.

---

## Security notes

- Passwords hashed with bcrypt (cost 12); sessions in Postgres with
  `httpOnly` + `sameSite=lax` cookies (`secure` in production).
- CSRF tokens on all state-changing requests; login is rate-limited with
  generic errors (no user enumeration); session is regenerated on login.
- `helmet` security headers + CSP; stored article HTML is sanitized
  (`sanitize-html`) to prevent stored XSS.
- Analytics is privacy-friendly: no cross-site cookies, no raw PII, hashed
  daily visitor IDs.
- Keep all secrets in Railway env — never commit them. `.env` is git-ignored.

## Go-live checklist (#22)

- [ ] Postgres provisioned; `npm run migrate` succeeds on deploy.
- [ ] `create-admin` run; login works over HTTPS.
- [ ] `GITHUB_TOKEN` (contents:write, this repo only) set; test publish commits
      and the post appears on Pages.
- [ ] `seed:articles` run; existing posts managed by the CMS with no regression.
- [ ] `track.js` loads on the live pages; a visit + CTA click show in analytics.
- [ ] Backups enabled; retention cron scheduled; secrets audited.
