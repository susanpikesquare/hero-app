-- ensure_chore_instances_for_date(family_id, due_date)
--
-- Lazy-generate chore_instances for every active chore in `family_id`
-- whose recurrence pattern says it's due on `due_date`. Idempotent via
-- the unique (chore_id, due_date) index — calling this multiple times
-- for the same date is safe and cheap.
--
-- Caller: the parent dashboard, the parent queue view, and the kid Today
-- list all call this on mount with `today` (in the client's local tz).
-- We trust the client's date — multi-timezone reconciliation is a Beta
-- problem.
--
-- Recurrence semantics:
--   - none   : one instance on starts_on. If due_date < starts_on, skip.
--              If due_date > starts_on, the instance was already created
--              the day it was due; we don't backfill across time.
--   - daily  : one instance per day on/after starts_on.
--   - weekly : one instance on days where extract(isodow from due_date)
--              is in recurrence_days. ISO day-of-week: 1=Monday..7=Sunday.

create or replace function public.ensure_chore_instances_for_date(
  p_family_id uuid,
  p_due_date  date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_uid uuid;
begin
  -- Authorization: caller must be a member of the target family.
  v_caller_uid := auth.uid();
  if v_caller_uid is null then
    raise exception 'auth required';
  end if;

  if not exists (
    select 1 from public.family_members fm
    where fm.auth_user_id = v_caller_uid
      and fm.family_id = p_family_id
  ) then
    raise exception 'not a member of this family';
  end if;

  -- Generate. Conflict-do-nothing keeps the call idempotent.
  insert into public.chore_instances
    (chore_id, kid_id, family_id, due_date, status)
  select
    c.id,
    c.kid_id,
    c.family_id,
    p_due_date,
    'open'::public.instance_status
  from public.chores c
  where c.family_id = p_family_id
    and c.active = true
    and c.starts_on <= p_due_date
    and (
      (c.recurrence_type = 'none'
        and c.starts_on = p_due_date)
      or
      (c.recurrence_type = 'daily')
      or
      (c.recurrence_type = 'weekly'
        and extract(isodow from p_due_date)::int = any(c.recurrence_days))
    )
  on conflict (chore_id, due_date) do nothing;
end;
$$;

comment on function public.ensure_chore_instances_for_date is
  'Lazy-generate chore_instances for the family on the given date. Idempotent. Called on each dashboard mount.';

revoke all on function public.ensure_chore_instances_for_date(uuid, date) from public;
grant execute on function public.ensure_chore_instances_for_date(uuid, date) to authenticated;
