# EduSim Hub — setup & deploy

A teacher-built library of interactive learning simulations. Teachers paste the
self-contained HTML from EduSim, tag it (grade / subject / concept / standard),
and publish it. Each sim gets a permanent link + QR code so students can open
and run it with no account. Everyone can browse and (signed-in teachers) rate.

- **Frontend:** Vite + React, deployed to **GitHub Pages** (main branch only — no `gh-pages`).
- **Backend:** **Supabase** (Postgres + Auth), called directly from the browser and secured by Row-Level Security.

---

## One-time setup (≈10 minutes)

These steps need dashboard/secret access, so they're yours to do. Everything
else (code + deploy) is already wired up.

### 1. Create the database

Supabase Dashboard → **SQL Editor** → New query → paste the entire contents of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the tables,
indexes, triggers, the view-count function, and all the security policies. It's
safe to re-run.

### 2. Confirm the project URL + key

The app is configured (in `src/lib/config.js`) with:

- **Project URL:** `https://ojifqcnsvbvkvpvwmovr.supabase.co`
- **Publishable (anon) key:** `sb_publishable_87Sk_...`

Open Supabase → **Project Settings → Data API** and confirm the **Project URL**
matches exactly. If not, fix it in `src/lib/config.js` (or set the repo
Variables in step 5). These keys are public and safe to commit — security comes
from the RLS policies, not from hiding the key.

### 3. Configure Auth (sign-in)

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://aisa-ai-web.github.io/html-viewer/`
- **Redirect URLs:** add both
  - `https://aisa-ai-web.github.io/html-viewer/`
  - `http://localhost:5173/html-viewer/` (for local dev)

**Email magic link** works immediately with no extra config.

**Google sign-in** (recommended for teachers) needs one extra step:
Authentication → **Providers → Google** → enable, and paste a Google OAuth
client ID + secret (from Google Cloud Console → Credentials → OAuth client;
set the authorized redirect URI to the value Supabase shows on that page,
i.e. `https://ojifqcnsvbvkvpvwmovr.supabase.co/auth/v1/callback`).
Until Google is configured, the "Continue with Google" button will error —
email magic link still works.

### 4. Enable GitHub Pages

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

That's it — every push to `main` runs `.github/workflows/deploy.yml`, which
builds the site and publishes it. No extra branch is created. The live URL is
**https://aisa-ai-web.github.io/html-viewer/**.

### 5. (Optional) Override the keys via repo Variables

If you'd rather not hardcode the keys, set repo → Settings → **Secrets and
variables → Actions → Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The build uses these when present and falls back to the committed defaults
otherwise.

---

## Local development

```bash
npm install
cp .env.example .env   # optional; defaults are baked in
npm run dev            # http://localhost:5173/html-viewer/
```

## How it works

- **Save:** a signed-in teacher's HTML + metadata is inserted into `simulations`
  (RLS lets you write only your own rows).
- **Share:** the viewer builds `https://aisa-ai-web.github.io/html-viewer/#/sim/<id>`
  and renders it as a QR. Hash routing means it works on Pages with no server.
- **Run:** students open the link; the HTML renders in an iframe with
  `sandbox="allow-scripts"` and **no** `allow-same-origin`, so it runs as a real
  page but cannot touch the host app, your session, or your data.
- **Browse/rate:** published sims are world-readable; ratings are one-per-teacher
  and aggregated into `avg_rating` / `rating_count` by a trigger.
