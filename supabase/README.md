# Supabase setup (one-time)

The app reads its training inventory live from Supabase, so content edits appear
without a redeploy. Until the env vars below are set, the app falls back to the
bundled static data in `src/data/inventory.ts` — so nothing breaks in the meantime.

## Steps

1. **Create the project** (Brady — I can't create accounts).
   - Go to https://supabase.com → sign up → **New project** (free tier is fine).
   - Pick a region close to your users; save the database password somewhere safe.

2. **Grab the keys.** Project → **Settings → API**. You'll need:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key — safe to embed in the app
   - **service_role** key — SECRET, server-side only

3. **Create `.env`** in the repo root (copy `.env.example`) and fill in all four
   values. `.env` is gitignored — the service_role key never gets committed.

4. **Create the tables.** Dashboard → **SQL Editor → New query** → paste the
   contents of `supabase/schema.sql` → **Run**.

5. **Seed data + upload GIFs.** From the repo root:
   ```
   node --env-file=.env scripts/seed_supabase.mjs
   ```
   This creates the public `exercise-media` bucket, uploads the 116 GIFs, and
   inserts the 12 categories / 43 circuits / 262 exercises. It's idempotent —
   safe to re-run after regenerating data.

6. **Run the app.** `npm run dev` — it now fetches live from Supabase. Deploys
   (`npm run build`) bake the `VITE_` values in at build time, so build+deploy
   from a machine that has `.env`.

## Editing content later

- **Quick path:** Dashboard → **Table Editor** → edit `categories` / `circuits`
  / `exercises` like a spreadsheet. To add an exercise GIF, upload it to the
  `exercise-media` bucket and put the filename in the row's `media_path`.
- **Later:** an in-app admin screen can write to these same tables.

## Regenerating from the spreadsheet

`scripts/gen_inventory.py` rebuilds `src/data/inventory.ts` **and**
`scripts/inventory.json` from the source xlsx. After regenerating, re-run the
seed script (step 5) to push changes to Supabase.
