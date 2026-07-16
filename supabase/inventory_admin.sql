-- Beach Track Club — make the training inventory admin-editable in the app.
-- Run once in the Supabase SQL Editor. Idempotent. Depends on public.is_admin().
--
-- Adds a `hidden` flag to categories/circuits/exercises and admin write access,
-- so a coach can disable (hide) or reorder items from the app. Athletes (anon)
-- only ever read non-hidden rows; admins read everything (to manage hidden ones).
-- Reordering uses the existing sort_order columns.

alter table categories add column if not exists hidden boolean not null default false;
alter table circuits   add column if not exists hidden boolean not null default false;
alter table exercises  add column if not exists hidden boolean not null default false;

-- ── categories ──
drop policy if exists "public read categories"     on categories;
drop policy if exists "admins read all categories" on categories;
drop policy if exists "admins insert categories"   on categories;
drop policy if exists "admins update categories"   on categories;
drop policy if exists "admins delete categories"   on categories;
create policy "public read categories"     on categories for select using (not hidden);
create policy "admins read all categories" on categories for select using (public.is_admin());
create policy "admins insert categories"   on categories for insert with check (public.is_admin());
create policy "admins update categories"   on categories for update using (public.is_admin());
create policy "admins delete categories"   on categories for delete using (public.is_admin());

-- ── circuits ──
drop policy if exists "public read circuits"     on circuits;
drop policy if exists "admins read all circuits" on circuits;
drop policy if exists "admins insert circuits"   on circuits;
drop policy if exists "admins update circuits"   on circuits;
drop policy if exists "admins delete circuits"   on circuits;
create policy "public read circuits"     on circuits for select using (not hidden);
create policy "admins read all circuits" on circuits for select using (public.is_admin());
create policy "admins insert circuits"   on circuits for insert with check (public.is_admin());
create policy "admins update circuits"   on circuits for update using (public.is_admin());
create policy "admins delete circuits"   on circuits for delete using (public.is_admin());

-- ── exercises ──
drop policy if exists "public read exercises"     on exercises;
drop policy if exists "admins read all exercises" on exercises;
drop policy if exists "admins insert exercises"   on exercises;
drop policy if exists "admins update exercises"   on exercises;
drop policy if exists "admins delete exercises"   on exercises;
create policy "public read exercises"     on exercises for select using (not hidden);
create policy "admins read all exercises" on exercises for select using (public.is_admin());
create policy "admins insert exercises"   on exercises for insert with check (public.is_admin());
create policy "admins update exercises"   on exercises for update using (public.is_admin());
create policy "admins delete exercises"   on exercises for delete using (public.is_admin());
