-- Beach Track Club — approval flow + extra profile fields. Run once (idempotent).

alter table profiles add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists school text;
alter table profiles add column if not exists class_year text;
alter table profiles add column if not exists events text;

-- Don't lock out accounts that existed before this ran; make demo the first admin.
update profiles set status = 'approved' where status = 'pending';
update profiles set is_admin = true where display_name = 'demo';

-- Admin check as a SECURITY DEFINER function (avoids RLS recursion).
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admins may update any profile (i.e. approve/reject).
drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update using (public.is_admin());

-- Prevent non-admins from changing their own status / is_admin (no self-approval).
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_profile_update on profiles;
create trigger guard_profile_update before update on profiles
  for each row execute function public.guard_profile_update();
