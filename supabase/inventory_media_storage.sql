-- Beach Track Club — let admins replace exercise GIFs from the app.
-- Run once in the Supabase SQL Editor. Idempotent. Depends on public.is_admin().
--
-- The "exercise-media" bucket is already PUBLIC (anyone can read the GIFs).
-- These policies add write access for signed-in admins so the in-app
-- "Change GIF" button can upload new images into the bucket.

drop policy if exists "admins upload exercise-media" on storage.objects;
drop policy if exists "admins update exercise-media" on storage.objects;
drop policy if exists "admins delete exercise-media" on storage.objects;

create policy "admins upload exercise-media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exercise-media' and public.is_admin());

create policy "admins update exercise-media" on storage.objects
  for update to authenticated
  using (bucket_id = 'exercise-media' and public.is_admin());

create policy "admins delete exercise-media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exercise-media' and public.is_admin());
