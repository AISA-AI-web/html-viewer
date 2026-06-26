# EduSim Hub

A teacher-built library of interactive learning simulations.

Teachers paste the self-contained HTML they get from **EduSim**, tag it by grade,
subject, concept, and standard, and publish it to a shared library. Every
simulation gets a permanent link and a **QR code** so students can open and run
it on any device — no account needed. Teachers can browse, search, filter, and
rate each other's simulations.

- **Frontend:** Vite + React (static), deployed to GitHub Pages.
- **Backend:** Supabase (Postgres + Auth), secured by Row-Level Security.
- **Untrusted HTML** runs in a locked-down, opaque-origin iframe.

## Getting started

See **[SETUP.md](SETUP.md)** for the one-time Supabase + GitHub Pages setup, and
for local development instructions.

```bash
npm install
npm run dev      # http://localhost:5173/html-viewer/
```
