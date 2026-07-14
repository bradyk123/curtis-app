-- Beach Track Club — user profiles & roles
-- Run once in the Supabase SQL Editor. Safe to re-run.

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role         text not null default 'athlete' check (role in ('athlete', 'coach')),
  team         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ───────── row level security ─────────
alter table profiles enable row level security;

-- Anyone signed in can read profiles (coaches need to see athletes). Adjust later if needed.
drop policy if exists "profiles readable" on profiles;
create policy "profiles readable" on profiles for select using (true);

-- A user may create and edit only their OWN profile row.
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- ───────── auto-provision a profile on signup ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users (e.g. accounts created before this ran)
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;
