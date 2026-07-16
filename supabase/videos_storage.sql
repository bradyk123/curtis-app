-- Beach Track Club — let admins upload/replace/delete video clips from the app.
-- Run once in the Supabase SQL Editor. Idempotent.
--
-- The "exercise-video" bucket is already PUBLIC (anyone can read the MP4s).
-- These policies add write access for signed-in admins only, so the in-app
-- "Upload" button (Phase 2) can push new clips into the bucket.
-- Depends on public.is_admin() from profiles_approval.sql.

drop policy if exists "admins upload exercise-video" on storage.objects;
drop policy if exists "admins update exercise-video" on storage.objects;
drop policy if exists "admins delete exercise-video" on storage.objects;

create policy "admins upload exercise-video" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exercise-video' and public.is_admin());

create policy "admins update exercise-video" on storage.objects
  for update to authenticated
  using (bucket_id = 'exercise-video' and public.is_admin());

create policy "admins delete exercise-video" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exercise-video' and public.is_admin());
