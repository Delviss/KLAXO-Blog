# Klaxo Admin Dashboard — Setup & Usage

Your blog now has a **login-based admin dashboard** at `/admin/` where you can
write and publish posts in a visual editor — no code, no HTML. Under the hood it
uses [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (a free, modern,
Decap-compatible content manager). When you hit **Publish**, it saves the post to
this GitHub repository and the site rebuilds itself automatically.

Your dashboard address will be:

```
https://<your-site-address>/admin/
```

(For example `https://delviss.github.io/KLAXO-Blog/admin/`, or `https://blog.klaxo.eu/admin/`
if you use a custom domain.)

---

## One-time setup (about 10 minutes)

Because GitHub Pages has no server of its own, the dashboard needs a tiny free
"login relay" so you can sign in with GitHub securely. You do this **once**.

### Step 1 — Deploy the free login relay

1. Open the relay project: **https://github.com/sveltia/sveltia-cms-auth**
2. Click the **“Deploy to Cloudflare Workers”** button in its README.
   (You’ll create a free Cloudflare account if you don’t have one — no credit card.)
3. When it finishes, Cloudflare gives you a URL like:
   `https://sveltia-cms-auth.<your-name>.workers.dev`
   **Copy this URL** — you’ll need it twice.

### Step 2 — Create a GitHub OAuth app

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (direct link: https://github.com/settings/developers)
2. Fill in:
   - **Application name:** `Klaxo CMS`
   - **Homepage URL:** your site address (e.g. `https://delviss.github.io/KLAXO-Blog/`)
   - **Authorization callback URL:** your relay URL from Step 1 **followed by `/callback`**,
     e.g. `https://sveltia-cms-auth.<your-name>.workers.dev/callback`
3. Click **Register application**.
4. Copy the **Client ID**, then click **Generate a new client secret** and copy that too.

### Step 3 — Give the relay your keys

1. In Cloudflare, open your Worker → **Settings → Variables** (Environment Variables).
2. Add these (mark the secret as *encrypted*):
   - `GITHUB_CLIENT_ID` = the Client ID from Step 2
   - `GITHUB_CLIENT_SECRET` = the client secret from Step 2
   - `ALLOWED_DOMAINS` = your site’s domain, e.g. `delviss.github.io` (or `blog.klaxo.eu`)
3. Save and let it redeploy.

### Step 4 — Point the dashboard at your relay

1. Open **`admin/config.yml`** in this repository.
2. Find the `base_url:` line and replace the placeholder with your relay URL from Step 1:
   ```yaml
   base_url: https://sveltia-cms-auth.<your-name>.workers.dev
   ```
3. Also confirm the `repo:` line matches your repository (`Delviss/KLAXO-Blog`).
4. Commit the change (edit on GitHub → *Commit changes*, or ask Claude to do it).

That’s it. ✅

---

## Publishing a post (the everyday flow)

1. Go to `https://<your-site-address>/admin/`
2. Click **Login with GitHub** and authorize once.
3. Click **Blog Posts → New Blog Post**.
4. Fill in the title, pick a category, add a cover image, and write your story.
5. Click **Publish**.
6. Wait ~1–2 minutes for the site to rebuild. Your post appears on the
   **Journal** page (`/blog.html`) and at its own address `/<your-post-slug>.html`.

You can find the Journal from the site’s **Discover** menu → **Journal**.

---

## How it fits together

| Piece | What it does |
|-------|--------------|
| `admin/` | The dashboard you log into (Sveltia CMS). |
| `_posts/` | Where your published posts are stored (Markdown files). |
| `_layouts/` | The templates that wrap each post in the Klaxo design. |
| `blog.html` | The **Journal** page that lists all your posts. |
| `.github/workflows/pages.yml` | Rebuilds and republishes the site on every change. |

Your existing hand-built pages (`index.html`, `about.html`, the article pages)
are untouched and keep working exactly as before.

---

## Troubleshooting

- **“Failed to authenticate” on login** → the callback URL in the GitHub OAuth app
  must be your relay URL **+ `/callback`**, and `base_url` in `admin/config.yml`
  must be that same relay URL (without `/callback`).
- **Login works but saving fails** → make sure your GitHub account has write access
  to `Delviss/KLAXO-Blog`.
- **Post published but not visible yet** → give it a minute; check the **Actions**
  tab on GitHub for the green “Deploy to GitHub Pages” run.
