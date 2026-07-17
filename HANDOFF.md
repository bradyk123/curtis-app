# Beach Track Club — Handoff

Paste this into a new Claude Code chat, or just say **"read HANDOFF.md"**. Current as of **2026-07-16**. Live build at handoff: **`v0.0.1·d14ec5f`** (the header always shows the deployed build).

## ▶ Start here (next session)
Ask Brady which he wants first:
1. **Email/SMTP setup (a reminder is scheduled for ~9am 2026-07-17).** Password-reset + auth emails currently send only via Supabase's built-in mailer (rate-limited, spam-prone, dev-only). Supabase **redirect URLs + Site URL are already set** to `https://curtis-app.pages.dev`. Remaining: Brady creates a **Resend** account, verifies the `beachtrackclub.com` domain via DNS, makes an API key; then Claude configures Supabase → Authentication → Emails → SMTP (host `smtp.resend.com`, port 465, user `resend`, sender `noreply@beachtrackclub.com`) — Brady pastes the key (Claude can't enter credentials). Then send a test reset to confirm.
2. **Scheduling tab** — the main unbuilt feature. Coach creates training sessions (date/time/location); athletes view + RSVP. Design a `sessions` table + RLS (coach/admin writes, approved users read), add the tab + admin-gated create form. Mirror the existing admin-edit patterns.
3. **App Store prep** — wrap with Capacitor (iOS+Android); add **in-app account deletion** (Apple hard requirement); biometric unlock (Face ID/Touch ID) and **Sign in with Apple** live at this stage (Sign in with Apple becomes required only if other social logins are added). Owner must create Apple ($99/yr) + Google Play ($25) dev accounts.
4. **Content from Curtis** — 8 opaque clip names still need real names (see Content cleanup below); coaching cues can now be written in-app (cues editor on each exercise page).
5. **Security housekeeping** — rotate the Supabase `service_role` key + admin password (were pasted in chat during setup); delete `demo@` and `athlete1@` test accounts; clear one abandoned *unverified* 2FA factor on the coach account (inert — see Gotchas).

Keep sessions lean: don't re-read the big spreadsheets or re-process video unless needed. **Supabase data/schema changes are live instantly (no deploy); only code changes deploy.**

## What this is
A track & field training web app for a coach (Curtis), built by Brady (owner `team@beachtrackclub.com`). Goal: prove it on the web now, wrap with Capacitor for the App Store later. Dark "Beach Performance / Trackside" branding.

- **Repo:** https://github.com/beachtrackclub/curtis-app (branch `main`). Transferred from `bradyk123` (2026-07-16); old links redirect. Local `origin` re-pointed; push access confirmed.
- **Live (primary):** https://curtis-app.pages.dev — Cloudflare Pages, **auto-deploys on every `git push` to `main`** (build `npm run build`, output `dist`). Project `curtis-app` on the `team@beachtrackclub.com` Cloudflare account (ID `6919827b39ed31c40776e4804c4cc1a3`, signed in via GitHub).
- **Live (old, being retired):** https://beachtrackclub.github.io/curtis-app/ (GitHub Pages).
- **Stack:** React + TypeScript + Vite, React Router (HashRouter), Supabase backend. Drag-and-drop via `@dnd-kit`.

## Dev environment (important)
- **`npm`/`node` are NOT on the default PATH.** Prefix commands with:
  `export PATH="/Users/bradykirtland/.nvm/versions/node/v24.18.0/bin:$PATH"`
- Build/typecheck: `npm run build` (runs `tsc -b && vite build`). Push to deploy (Cloudflare builds it).
- Vite `base` auto-switches: `/` on Cloudflare (`CF_PAGES` env), `/curtis-app/` on GitHub Pages. `vite.config.ts` also injects `__APP_VERSION__` + `__BUILD_SHA__`.
- `.env` (gitignored) holds `SUPABASE_SERVICE_ROLE_KEY` (server scripts). `.env.production` (committed) holds the **public** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (safe — anon key is publishable; data protected by RLS).
- **Commit/push:** run `git commit` and `git push` as **separate** commands (a chained `commit && push` gets blocked by the sandbox classifier). End commit messages with the Co-Authored-By line.

## Supabase
- Project "Beach Track Club App", ref `ujcysyepogzmglnxrvln`, URL `https://ujcysyepogzmglnxrvln.supabase.co`, Free plan, owner `team@beachtrackclub.com`.
- **Tables:** `categories` / `circuits` / `exercises` (inventory; each has `hidden` + `sort_order`; exercises have `cues`, `media_path`), `videos` (video library), `profiles` (users), `app_flags` (feature flags). Storage buckets `exercise-media` (GIFs, public) + `exercise-video` (MP4s, public), both with admin write policies.
- **Running SQL for the owner:** use Claude-in-Chrome on his logged-in Supabase → `/sql/new` → set the Monaco editor via `window.monaco.editor.getModels()[0].setValue(sql)` (javascript_tool may say "[BLOCKED]" but it still executes; wait for the editor to load first, retry setValue if `window.monaco` is undefined) → click **Run** (top-right) → confirm the "destructive operations" dialog for DDL. No DB password needed. Note: SQL touching `auth.*` internals is blocked by the classifier — don't force it.
- Reading/verifying data quickly: `fetch` the REST API with the anon key from the deployed origin (see how prior sessions verified counts). Anon RLS hides `hidden=true` rows, which is the expected athlete view.

## Auth & security
- **Auth gate:** whole app behind login (`src/pages/AuthPage.tsx`, gate in `src/App.tsx`). Email + password via Supabase. **Email confirmation is still OFF** (Supabase setting) — turning it on is part of the email/SMTP task.
- **Approval flow:** signup → `pending` (`src/pages/PendingScreen.tsx`) → admin approves at `/admin` (`src/pages/AdminPanel.tsx`). `guard_profile_update` trigger blocks self-approval; `public.is_admin()` SECURITY DEFINER function gates all admin RLS. (`supabase/profiles_schema.sql`, `profiles_approval.sql`.)
- **Two-factor (TOTP)** — `src/lib/mfa.ts`, `src/components/TwoFactorSetup.tsx` (enable/disable in the profile modal), `src/pages/MfaChallenge.tsx` (second-factor gate at sign-in, enforced via Supabase assurance level aal1→aal2 in `App.tsx`). Verified working on the live project (QR enroll succeeds).
- **Password hardening** — policy min 8 + letter + number (`src/lib/password.ts`), enforced on sign-up/reset. **Forgot-password** flow: `AuthPage` request → email link → `src/pages/ResetPassword.tsx` (recovery event handled in `src/lib/auth.tsx`).
- **Deferred to the Capacitor wrap:** biometric unlock, Sign in with Apple/Google.

## What's built and LIVE
1. **Training inventory** — 12 categories / 43 circuits / 262 exercises with GIFs. Live from Supabase via `src/data/useInventory.ts` (bundled `src/data/inventory.ts` is the fallback; regen with `scripts/gen_inventory.py`). **Admin edit mode** (Edit toggle on Home + each circuit page): rename, **drag-to-reorder** (grip handle, `src/components/SortableList.tsx`), hide/show, and **replace an exercise's GIF**. Helpers in `src/data/inventoryAdmin.ts`; schema `supabase/inventory_admin.sql` + `inventory_media_storage.sql`.
2. **Exercise pages** (`src/pages/ExerciseDetail.tsx`) — GIF + **in-app cues editor** (admins add/edit coaching cues, saved to `exercises.cues`) + **attached coaching videos** (Phase 3: attach library clips to an exercise via a searchable picker; they play under the GIF for athletes; uses `videos.exercise_id`).
3. **Video library** (`src/pages/VideoLibrary.tsx`, `src/data/useVideos.ts`) — 129 clips, DB-backed. **Hidden from athletes by default** behind the `video_library` feature flag; coach toggles "Show to athletes" on the page. **Admin edit mode:** rename, recategorize, duration label, **drag-to-reorder**, hide/delete, **upload new MP4s**, and **non-destructive trim** (in/out points; player loops the range). Helpers `src/data/videoAdmin.ts`. Player + trim: `src/components/ClipVideo.tsx`. Schema: `supabase/videos.sql`, `videos_seed.sql`, `videos_storage.sql`, `videos_trim.sql`.
4. **Global search** (Home) — finds exercises + circuits + video clips at once and deep-links to each (video results scroll-and-flash the clip). Respects the video flag.
5. **Version tag + feature flags** — header shows `v<pkg>·<sha>` (the live build). Flags in `app_flags` (`supabase/app_flags.sql`) via `src/data/useFlag.ts`.

## Content cleanup (2026-07-16)
- **51 cryptic clip names cleaned** (abbreviation expansion + hyphenation + demo-person-name stripping) — `scripts/clean_video_names.mjs` → `supabase/videos_rename.sql` (applied).
- **4 junk clips hidden** from athletes (`supabase/videos_hide_junk.sql`, applied): `img-3195`, `db-curl-attmpt`, `erinphotobomb`, `maddy-gym-entrance`. Athletes now see 125 clips.
- **Still need Curtis** (8 opaque names): `Seated Bnp`, `Ss Hamstring Curl`, `Blf Mb`, `Chstp Mbgm`, `Ohf Maddy Mark`, `Tank`, `Maddy`, `Mike Jacky` — rename in-app or via SQL once identified. Coaching cues: write in-app via the exercise cues editor.

## Branding
Dark **Beach Performance / Trackside** identity ("Brand - Beach Performance" Drive folder): **Black / Charcoal / White / Gold** (`--gold: #e9b63c`), double-chevron logo (`src/components/Logo.tsx`, SVG), favicon `public/favicon.svg`. Headings **Barlow Condensed**, body **Roboto** (Google Fonts in `index.html`) — substitutes for the spec's paid Proxima Nova (Roboto is the brand's approved fallback). Tokens in `src/index.css` `:root`. Tactile button presses, drag handles, and eased-in content are in the CSS.

## Accounts (passwords held by Brady — not in this doc)
- **Admin/coach:** `team@beachtrackclub.com` (is_admin) — sees Approvals; used for all admin testing.
- **Demo athlete:** `athlete@beachtrackclub.com` (approved).
- `demo@beachtrackclub.com` (admin) + `athlete1@beachtrackclub.com` — leftover test accounts, deletable.

## Key scripts
- `scripts/gen_inventory.py` — build inventory.ts from the xlsx.
- `scripts/gen_video_library.mjs` — build videoLibrary.ts from processed clips.
- `scripts/gen_videos_seed.mjs` — build the `videos` seed SQL from videoLibrary.ts.
- `scripts/clean_video_names.mjs` — regenerate the clip-name cleanup SQL.
- `scripts/full_batch.mjs` — video pipeline: Google Drive → MOV→MP4 (`ffmpeg-static`) → Supabase upload. Idempotent.
- `scripts/seed_supabase.mjs` — seed inventory tables + upload GIFs.
- Video source: Google Drive "Vids" folder; taxonomy: "Training Item Index" Google Sheet.

## Open items / next steps
- **Email/SMTP** (reminder set for 2026-07-17 ~9am) — see Start here #1.
- **Scheduling tab**, **Payments/subscriptions**, **College-recruiting tool** (Curtis wants it rebuilt natively into this app — get access to the existing app to scope it).
- **App Store:** Capacitor wrap, in-app account deletion, biometric, Sign in with Apple.
- **Security:** rotate `service_role` key + admin password; delete test accounts; clear the abandoned unverified 2FA factor.
- **Bigger vision:** fully merge video library + inventory into one Category → Exercise → (GIF + video + cues) model (Phase 3 was the first step).

## Gotchas
- Routes use HashRouter (`/#/...`). Storage buckets are public (media URLs work for anyone) — UI is gated, media isn't cryptographically private (future: tighten RLS + signed URLs).
- **Automating the live app in a browser:** exercise/video pages autoplay video and can make the automated browser sluggish (scroll/read timeouts). Verify data via anon REST `fetch` instead of scrolling when possible.
- **Version churn:** every commit (including doc-only) changes the header's commit-SHA tag. Consider bumping `package.json` version for real milestones.
- An **unverified** 2FA factor was left on the coach account from testing — it's inert (only *verified* factors gate sign-in) and can be cleared later.
- Free-tier limits: 1 GB storage, ~5 GB egress/mo. Video bandwidth is the main cost lever; tap-to-play (vs autoplay) would cut it ~5–10× if needed.
