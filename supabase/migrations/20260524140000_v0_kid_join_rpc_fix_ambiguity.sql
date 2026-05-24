-- Fix ambiguous column reference in kid_link_with_join_code.
--
-- The original RETURNS TABLE declaration created OUT parameters named
-- family_id and display_name. Inside the function body the unqualified
-- references to `family_id` in the initial SELECT were ambiguous between
-- the OUT param (from the function signature) and the column on
-- public.family_members. Postgres rejected the call with 42702:
--   "column reference \"family_id\" is ambiguous"
--
-- Fix: alias public.family_members as fm and fully qualify every column
-- reference inside the function. The function signature (and therefore
-- the calling contract) is unchanged — only the implementation moves to
-- table-qualified column names so plpgsql never has to guess.

create or replace function public.kid_link_with_join_code(p_code text)
returns table (
  family_member_id uuid,
  family_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_kid record;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  select fm.id,
         fm.family_id,
         fm.display_name,
         fm.kid_join_code_expires_at,
         fm.auth_user_id
    into v_kid
    from public.family_members fm
   where fm.kid_join_code = upper(trim(p_code))
     and fm.role = 'kid'
   for update;

  if v_kid.id is null then
    raise exception 'invalid_join_code' using errcode = 'P0001';
  end if;

  if v_kid.kid_join_code_expires_at is not null
     and v_kid.kid_join_code_expires_at < now()
  then
    raise exception 'join_code_expired' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from public.family_members fm
     where fm.auth_user_id = v_uid
       and fm.id <> v_kid.id
  ) then
    raise exception 'auth_user_already_linked' using errcode = 'P0001';
  end if;

  update public.family_members fm
     set auth_user_id = v_uid,
         kid_joined_at = coalesce(fm.kid_joined_at, now()),
         kid_join_code = null,
         kid_join_code_expires_at = null
   where fm.id = v_kid.id;

  return query
    select v_kid.id, v_kid.family_id, v_kid.display_name;
end;
$$;
