-- submissions.actor_role (PRD §3 + engineering-defaults §6).
--
-- The "kid-initiated completion" north-star metric needs to distinguish
-- submissions created by a kid (in their own session) from submissions
-- created by a parent. The PRD's operational definition:
--
--   A completion is KID-INITIATED if actor_role='kid'
--   AND no parent_nudges row exists for the same (kid_id) within the
--   prior 30 minutes.
--
-- We capture actor_role on every submission via a trigger that reads
-- family_members.role for the authenticated user at insert time. The
-- client cannot fake this; the trigger overwrites whatever the client
-- sent (unless the row arrived with a non-null value, which we treat
-- as a trusted system import path).
--
-- For pre-existing submissions, actor_role stays NULL. Analytics treats
-- NULL as "unknown" rather than misattributing.

create type public.actor_role as enum ('parent', 'kid');

alter table public.submissions
  add column if not exists actor_role public.actor_role;

comment on column public.submissions.actor_role is
  'Who created the submission. Captured server-side from family_members.role at insert. Powers the kid-initiated metric.';

create or replace function public.set_submission_actor_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.member_role;
begin
  if NEW.actor_role is not null then
    return NEW;
  end if;

  select fm.role into v_role
  from public.family_members fm
  where fm.auth_user_id = auth.uid()
  limit 1;

  if v_role is null then
    return NEW;
  end if;

  NEW.actor_role := v_role::text::public.actor_role;
  return NEW;
end;
$$;

drop trigger if exists submissions_set_actor_role on public.submissions;
create trigger submissions_set_actor_role
  before insert on public.submissions
  for each row
  execute function public.set_submission_actor_role();
