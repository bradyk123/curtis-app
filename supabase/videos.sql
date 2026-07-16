-- Beach Track Club — video library schema (Supabase / Postgres)
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "drop policy if exists".
--
-- Moves the video library out of the compiled app (src/data/videoLibrary.ts) and
-- into a table so admins can edit it live — rename, recategorize, reorder, hide,
-- set a duration label, and (Phase 3) attach a clip to a training exercise.
--
-- Depends on public.is_admin() from profiles_approval.sql (already applied — the
-- in-app admin approvals use it). Writes are restricted to admins; the anon key
-- can only READ non-hidden rows.

-- ─────────────────────────── table ───────────────────────────
create table if not exists videos (
  id             bigint generated always as identity primary key,
  slug           text unique not null,       -- from the storage filename, e.g. "a-skip"
  name           text not null,
  category       text not null,
  storage_path   text not null,              -- filename in the "exercise-video" bucket, e.g. "a-skip.mp4"
  duration_label text,                        -- editable label like "0:12"; null = auto-detect on the client
  trim_start     real,                         -- in-point (seconds); null = start of file
  trim_end       real,                         -- out-point (seconds); null = end of file
  sort_order     int  not null default 0,    -- order within a category
  hidden         boolean not null default false,
  exercise_id    bigint references exercises(id) on delete set null,  -- Phase 3: link into training inventory
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists videos_category_idx on videos(category);
create index if not exists videos_exercise_idx on videos(exercise_id);

-- ─────────────────────── row level security ───────────────────────
alter table videos enable row level security;

-- Everyone may read visible clips; admins additionally see hidden ones (edit mode).
-- Multiple permissive SELECT policies combine with OR.
drop policy if exists "public read videos"     on videos;
drop policy if exists "admins read all videos" on videos;
create policy "public read videos"     on videos for select using (not hidden);
create policy "admins read all videos" on videos for select using (public.is_admin());

-- Only admins may write.
drop policy if exists "admins insert videos" on videos;
drop policy if exists "admins update videos" on videos;
drop policy if exists "admins delete videos" on videos;
create policy "admins insert videos" on videos for insert with check (public.is_admin());
create policy "admins update videos" on videos for update using (public.is_admin());
create policy "admins delete videos" on videos for delete using (public.is_admin());

-- Keep updated_at fresh on every write.
create or replace function public.touch_videos_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists touch_videos_updated_at on videos;
create trigger touch_videos_updated_at before update on videos
  for each row execute function public.touch_videos_updated_at();
