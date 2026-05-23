-- SECURITY DEFINER RPC: validates an invite code, creates the family,
-- registers the caller as the parent, and increments times_used atomically.
-- Returns the new family_id, or raises an exception with a client-friendly message.
create or replace function public.redeem_invite_and_create_family(
  p_code text,
  p_family_name text,
  p_parent_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_code_row record;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'invite_code_required' using errcode = 'P0001';
  end if;

  if p_family_name is null or length(trim(p_family_name)) = 0 then
    raise exception 'family_name_required' using errcode = 'P0001';
  end if;

  if p_parent_display_name is null or length(trim(p_parent_display_name)) = 0 then
    raise exception 'display_name_required' using errcode = 'P0001';
  end if;

  -- Reject if this user is already in a family
  if exists (select 1 from public.family_members where auth_user_id = auth.uid()) then
    raise exception 'already_in_family' using errcode = 'P0001';
  end if;

  -- Lock the code row to prevent race on times_used
  select * into v_code_row
  from public.invite_codes
  where code = trim(p_code) and revoked = false
  for update;

  if not found then
    raise exception 'invalid_invite_code' using errcode = 'P0001';
  end if;

  if v_code_row.expires_at is not null and v_code_row.expires_at < now() then
    raise exception 'invite_code_expired' using errcode = 'P0001';
  end if;

  if v_code_row.times_used >= v_code_row.max_uses then
    raise exception 'invite_code_already_used' using errcode = 'P0001';
  end if;

  -- All checks passed; create the family + parent record
  insert into public.families (name, invite_code_used)
  values (trim(p_family_name), trim(p_code))
  returning id into v_family_id;

  insert into public.family_members (family_id, auth_user_id, role, display_name)
  values (v_family_id, auth.uid(), 'parent', trim(p_parent_display_name));

  update public.invite_codes
  set times_used = times_used + 1
  where code = trim(p_code);

  return v_family_id;
end;
$$;

grant execute on function public.redeem_invite_and_create_family(text, text, text) to authenticated;
