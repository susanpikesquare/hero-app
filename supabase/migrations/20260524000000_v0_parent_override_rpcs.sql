-- Apply a parent override on a submission. Parents only. Reason is required
-- for approvals (Erica's three encouragement-first phrases) and must be
-- null for rejections. Caller's family membership is verified inside.
create or replace function public.apply_parent_override(
  p_submission_id uuid,
  p_override public.override_kind,
  p_reason public.override_reason
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid;
  v_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  select id, family_id
    into v_parent_id, v_family_id
    from public.family_members
   where auth_user_id = auth.uid()
     and role = 'parent'
   limit 1;

  if v_parent_id is null then
    raise exception 'parents_only' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from public.submissions s
      join public.chores c on c.id = s.chore_id
     where s.id = p_submission_id
       and c.family_id = v_family_id
  ) then
    raise exception 'submission_not_in_family' using errcode = 'P0001';
  end if;

  if p_override = 'approved' and p_reason is null then
    raise exception 'reason_required_for_approval' using errcode = 'P0001';
  end if;
  if p_override = 'rejected' and p_reason is not null then
    raise exception 'reason_not_allowed_for_rejection' using errcode = 'P0001';
  end if;

  update public.submissions
     set parent_override = p_override,
         parent_override_reason = p_reason,
         parent_override_by = v_parent_id,
         parent_override_at = now(),
         status = 'complete'
   where id = p_submission_id;
end;
$$;

create or replace function public.clear_parent_override(
  p_submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  select family_id into v_family_id
    from public.family_members
   where auth_user_id = auth.uid() and role = 'parent'
   limit 1;

  if v_family_id is null then
    raise exception 'parents_only' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from public.submissions s
      join public.chores c on c.id = s.chore_id
     where s.id = p_submission_id
       and c.family_id = v_family_id
  ) then
    raise exception 'submission_not_in_family' using errcode = 'P0001';
  end if;

  update public.submissions
     set parent_override = null,
         parent_override_reason = null,
         parent_override_by = null,
         parent_override_at = null,
         status = case
           when ai_verdict is not null then 'pending_parent'::public.submission_status
           else 'pending_ai'::public.submission_status
         end
   where id = p_submission_id;
end;
$$;

revoke execute on function public.apply_parent_override(uuid, public.override_kind, public.override_reason) from public, anon;
grant execute on function public.apply_parent_override(uuid, public.override_kind, public.override_reason) to authenticated;

revoke execute on function public.clear_parent_override(uuid) from public, anon;
grant execute on function public.clear_parent_override(uuid) to authenticated;
