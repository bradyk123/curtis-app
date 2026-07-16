-- Beach Track Club — simple app-wide feature flags a coach can toggle in-app.
-- Run once in the Supabase SQL Editor. Idempotent. Depends on public.is_admin().
--
-- First use: video_library visibility. Default OFF — the Video Library is hidden
-- from athletes until the coach flips it on from within the app (they can still
-- open and populate it as admin in the meantime).

create table if not exists app_flags (
  key        text primary key,
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table app_flags enable row level security;

-- Anyone may read flags (the app needs to know what to show); only admins write.
drop policy if exists "public read flags" on app_flags;
drop policy if exists "admins write flags" on app_flags;
create policy "public read flags" on app_flags for select using (true);
create policy "admins write flags" on app_flags for all using (public.is_admin()) with check (public.is_admin());

-- Start with the Video Library hidden from athletes.
insert into app_flags (key, enabled) values ('video_library', false)
on conflict (key) do nothing;
