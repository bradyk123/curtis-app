-- Curtis App — training inventory schema (Supabase / Postgres)
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "drop policy if exists".
--
-- Model: category 1─┐
--                   └─* circuit 1─┐
--                                 └─* exercise
-- Slugs are the human-facing ids used in app routes. bigint identity PKs are
-- used internally for foreign keys so content can be renamed without breaking
-- relations.

-- ─────────────────────────── tables ───────────────────────────
create table if not exists categories (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists circuits (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  category_id bigint not null references categories(id) on delete cascade,
  name        text not null,
  subtitle    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists exercises (
  id          bigint generated always as identity primary key,
  circuit_id  bigint not null references circuits(id) on delete cascade,
  slug        text not null,
  name        text not null,
  media_path  text,          -- filename in the "exercise-media" storage bucket, e.g. "abc123.gif"
  cues        text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (circuit_id, slug)  -- exercise slugs repeat across circuits, unique within one
);

create index if not exists circuits_category_idx  on circuits(category_id);
create index if not exists exercises_circuit_idx   on exercises(circuit_id);

-- ─────────────────────── row level security ───────────────────────
-- Public app: anyone may READ. Nobody may write through the public/anon key.
-- The seed script and future admin use the service_role key, which BYPASSES
-- RLS, so no write policies are needed yet. (When the in-app admin is built,
-- add authenticated write policies here.)
alter table categories enable row level security;
alter table circuits   enable row level security;
alter table exercises  enable row level security;

drop policy if exists "public read categories" on categories;
drop policy if exists "public read circuits"   on circuits;
drop policy if exists "public read exercises"  on exercises;

create policy "public read categories" on categories for select using (true);
create policy "public read circuits"   on circuits   for select using (true);
create policy "public read exercises"  on exercises  for select using (true);

-- ─────────────────────────── storage ───────────────────────────
-- The exercise GIFs live in a PUBLIC storage bucket named "exercise-media".
-- The seed script (scripts/seed_supabase.mjs) creates the bucket and uploads
-- the files automatically, so you normally don't need to do anything here.
-- To create it manually instead: Dashboard → Storage → New bucket →
-- name "exercise-media", toggle "Public bucket" ON.
