# Beach Track Club — Handoff

Paste this into a new Claude Code chat, or say "read HANDOFF.md". Everything here is current as of the last session.

## ▶ Start here (next session)
Do these roughly in order — but ask Brady which he wants first:
1. **Cloudflare Pages — DONE (2026-07-16).** Live at https://curtis-app.pages.dev, auto-deploys from `main` on git push (verified). Build `npm run build`, output `dist`. Owner is the `team@beachtrackclub.com` Cloudflare account (signed in via GitHub). Still to verify: sign-in + video library on the live site (needs Brady's password — the auth page renders and Supabase config loads fine).
2. **Video editor — Phases 1 & 2 DONE (2026-07-16).** Video library now lives in a Supabase `videos` table (was compiled-in). App reads it live; admins get an in-app Edit toggle on the Video Library page: rename, recategorize, duration label, reorder (up/down), hide/show, delete, upload new MP4s, and **trim clips via non-destructive in/out points** (`trim_start`/`trim_end` seconds; the player loops within the range, the file is untouched). Files: `supabase/videos.sql` + `videos_seed.sql` + `videos_storage.sql` + `videos_trim.sql` (all applied), `src/data/useVideos.ts`, `src/data/videoAdmin.ts`, `src/pages/VideoLibrary.tsx`. **Phase 3 (remaining):** merge video ↔ training inventory — attach a clip to an exercise (the `videos.exercise_id` column already exists) and show it on exercise/circuit detail.
3. **Then the Scheduling tab** (coach creates sessions, athletes view/RSVP). Design the `sessions` table + RLS (coach writes, athletes read), add the tab + admin-gated create form.
4. **Housekeeping when convenient:** rotate the Supabase `service_role` key + admin password (were exposed in chat); delete the `demo@` and `athlete1@` test accounts; tidy the raw video clip names (now editable in-app via the video editor).

Keep sessions lean: don't re-read the big spreadsheets or re-process video unless a task needs it. Supabase changes are live instantly (no deploy); only code changes deploy.

## What this is
A track & field training web app for a coach (Curtis). Being built by Brady (owner: `team@beachtrackclub.com`). Goal: prove it out on the web now, wrap with Capacitor for the App Store later.

- **Repo:** https://github.com/beachtrackclub/curtis-app (branch `main`). Transferred from `bradyk123` on 2026-07-16; old `bradyk123/curtis-app` links redirect.
- **Live (GitHub Pages):** https://beachtrackclub.github.io/curtis-app/ (being retired in favor of Cloudflare Pages)
- **Live (Cloudflare Pages):** https://curtis-app.pages.dev (primary; auto-deploys on git push to `main`). Project `curtis-app` on the `team@beachtrackclub.com` Cloudflare account (ID `6919827b39ed31c40776e4804c4cc1a3`).
- **Stack:** React + TypeScript + Vite, React Router (HashRouter), Supabase backend

## Dev environment (important)
- **`npm`/`node` are NOT on the default PATH.** Prefix commands with:
  `export PATH="/Users/bradykirtland/.nvm/versions/node/v24.18.0/bin:$PATH"`
- Build: `npm run build` · Deploy to GitHub Pages: `npm run deploy` (gh-pages) · Cloudflare auto-deploys on `git push` once connected.
- Vite `base` auto-switches: `/` on Cloudflare (`CF_PAGES` env), `/curtis-app/` on GitHub Pages.
- `.env` (gitignored) holds `SUPABASE_SERVICE_ROLE_KEY` (server-side scripts only). `.env.production` (committed) holds the **public** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (safe — anon key is publishable; data protected by RLS).

## Supabase
- Project "Beach Track Club App", ref `ujcysyepogzmglnxrvln`, URL `https://ujcysyepogzmglnxrvln.supabase.co`, Free plan, owner `team@beachtrackclub.com`.
- **Tables:** `categories`/`circuits`/`exercises` (inventory), `profiles` (users), storage buckets `exercise-media` (GIFs, public) + `exercise-video` (MP4s, public).
- **Running SQL for the owner:** use Claude-in-Chrome on his logged-in beachtrackclub Supabase → go to `/sql/new` → set the Monaco editor via `window.monaco.editor.getModels()[0].setValue(sql)` (javascript_tool may say "[BLOCKED]" but it still executes) → click **Run** → confirm the "destructive operations" dialog for DDL. No DB password needed. Schema files live in `supabase/*.sql`.
- **Runtime, not build-time:** the app reads Supabase live in the browser, so data/schema changes appear instantly on every deployed version — no redeploy needed. Only *code* changes need a deploy.

## What's built and LIVE
1. **Auth gate** — whole app is behind login (`src/pages/AuthPage.tsx`, gate in `src/App.tsx`). Email confirmation is OFF.
2. **Approval flow** — signup → `pending` (`src/pages/PendingScreen.tsx`, collects name/role/school/class_year/events) → admin approves in-app at `/admin` (`src/pages/AdminPanel.tsx`, "Approvals" header link, admins only). A `guard_profile_update` trigger stops logged-in non-admins from self-approving (but allows server-side/SQL setup).
3. **Profiles & roles** — `src/lib/profile.ts`; role athlete/coach, `is_admin`, school/class_year/events.
4. **Training inventory** — 12 categories / 43 circuits / 262 exercises with GIFs. Data in generated `src/data/inventory.ts` (regen: `scripts/gen_inventory.py` from `~/Desktop/Track & Field App - Sheets.xlsx`, Circuits+Items sheets). Fetched live via `src/data/useInventory.ts` (falls back to bundled static data). **Admin edit mode** (2026-07-16): Edit toggle on Home + each circuit page lets a coach hide/show, reorder (up/down), rename categories/circuits/exercises, and **replace an exercise's GIF** (tap the thumbnail / GIF button → uploads to the `exercise-media` bucket, updates `media_path`). `hidden` columns + admin RLS in `supabase/inventory_admin.sql`; GIF-bucket write policies in `supabase/inventory_media_storage.sql` (both applied); write helpers in `src/data/inventoryAdmin.ts`. Athletes only see non-hidden rows. **Global search** on Home now finds exercises + circuits + video clips and deep-links to them.
5. **Video library** — 129 clips across 7 categories, web MP4 in `exercise-video` bucket, at `/video-library` (`src/pages/VideoLibrary.tsx`, on-screen autoplay grid). **Now DB-backed** (Supabase `videos` table via `src/data/useVideos.ts`), with an **admin edit mode** (rename/recategorize/reorder/duration/hide/delete/upload — `src/data/videoAdmin.ts`). Bundled `src/data/videoLibrary.ts` remains the offline fallback + the source for the one-time seed.

## Version + feature flags
- **App version** shows in the header as `v<pkg version>·<commit sha>` (injected in `vite.config.ts` from `package.json` + `CF_PAGES_COMMIT_SHA`, falling back to local git HEAD). That tag = the exact deployed build; read it to know what's live.
- **Feature flags** live in the `app_flags` table (`supabase/app_flags.sql`, applied; public read, admin write) via `src/data/useFlag.ts`. First flag: **`video_library`** (default **false** = hidden from athletes). A coach toggles **Show/Hide to athletes** on the Video Library page; admins can always open + populate it. Home banner + search video results respect the flag.

## Branding (applied 2026-07-16)
Dark **Beach Performance / Trackside** identity from the "Brand - Beach Performance" Drive folder: colors **Black / Charcoal / White / Gold** (`--gold: #e9b63c`), double-chevron logo (`src/components/Logo.tsx`, SVG, `currentColor`), favicon `public/favicon.svg`. Type spec calls for **Proxima Nova Condensed Black** (headings) / **Proxima Nova or Roboto** (body); Proxima Nova isn't free, so headings use **Barlow Condensed** and body uses **Roboto** (the brand's approved fallback) via Google Fonts in `index.html`. All theme tokens live in `src/index.css` `:root`. To fine-tune the gold or swap in licensed Proxima Nova, edit those two files. Exact PNG logo can replace the SVG if pixel-perfect fidelity is wanted.

## Accounts (passwords held by Brady — not in this doc)
- **Admin:** `team@beachtrackclub.com` (is_admin, coach) — sees Approvals.
- **Demo athlete:** `athlete@beachtrackclub.com` (approved).
- `demo@beachtrackclub.com` is also admin; `athlete1@beachtrackclub.com` is a leftover test account — both deletable.

## Key scripts
- `scripts/gen_inventory.py` — build inventory.ts from the xlsx.
- `scripts/gen_video_library.mjs` — build videoLibrary.ts from processed clips.
- `scripts/full_batch.mjs` — video pipeline: download from Google Drive → convert MOV→MP4 (`ffmpeg-static` npm) → upload to Supabase. Idempotent/resumable.
- `scripts/seed_supabase.mjs` — seed inventory tables + upload GIFs.
- Video source: Google Drive "Vids" folder (shared link), organized by category. New taxonomy source: "Training Item Index" Google Sheet.

## Open items / next steps
- **Verify Cloudflare live site while signed in** — sign in at https://curtis-app.pages.dev and confirm the video library + inventory load (build/deploy/auto-deploy already verified; only the authenticated flows are unconfirmed).
- **Security:** rotate the Supabase `service_role` key and the admin password (both were pasted in chat during setup).
- **GitHub credentials note:** the repo was transferred `bradyk123 → beachtrackclub` (2026-07-16); local `origin` re-pointed and push access confirmed. If a future machine can't push, re-auth GitHub as `beachtrackclub`.
- **Cleanup:** retire `demo@` and `athlete1@` test accounts.
- **Content:** video clip names come from raw Drive filenames (some like "Img 3195") — tidy them / map to the sheet's Semantic Name + Variant taxonomy. Coaching cues are largely missing from the source data.
- **Bigger:** the new video library currently coexists with the old GIF/circuit inventory; the deeper project is merging them into one Category → Semantic Name → Variant model.
- **Future features:** Scheduling tab, Payments/subscriptions, College-recruiting search (the full "Beach" app vision).
- **App Store:** wrap with Capacitor (iOS+Android); owner must create Apple ($99/yr) + Google Play ($25) dev accounts; add in-app account deletion (Apple requirement); if social login is added, must add "Sign in with Apple".

## Gotchas
- Routes use HashRouter (`/#/...`). Supabase Storage buckets are public (media URLs work for anyone) — UI is gated but media isn't cryptographically private (a future "lock down data" step could tighten RLS + use signed URLs).
- Free-tier limits: 1 GB storage, ~5 GB egress/month. ~$25/mo Supabase Pro when it grows. Video bandwidth is the main cost lever; switching the library to tap-to-play (from autoplay) would cut it ~5–10× if needed.
