-- Parent-side: generate a fresh join code for a kid in their family.
-- Rotates if one already exists. 24-hour expiry.
create or replace function public.generate_kid_join_code(p_kid_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_family uuid;
  v_kid_family uuid;
  v_kid_role public.member_role;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i int;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  select family_id into v_parent_family
    from public.family_members
   where auth_user_id = auth.uid() and role = 'parent'
   limit 1;

  if v_parent_family is null then
    raise exception 'parents_only' using errcode = 'P0001';
  end if;

  select family_id, role into v_kid_family, v_kid_role
    from public.family_members
   where id = p_kid_id;

  if v_kid_family is null or v_kid_family <> v_parent_family or v_kid_role <> 'kid' then
    raise exception 'kid_not_in_family' using errcode = 'P0001';
  end if;

  for v_attempt in 1..6 loop
    v_code := '';
    for v_i in 1..10 loop
      v_code := v_code || substr(
        v_alphabet,
        1 + floor(random() * length(v_alphabet))::int,
        1
      );
    end loop;
    v_code := substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5);

    begin
      update public.family_members
         set kid_join_code = v_code,
             kid_join_code_expires_at = now() + interval '24 hours'
       where id = p_kid_id;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  return v_code;
end;
$$;

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

  select id, family_id, display_name, kid_join_code_expires_at, auth_user_id
    into v_kid
    from public.family_members
   where kid_join_code = upper(trim(p_code))
     and role = 'kid'
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
    select 1 from public.family_members
     where auth_user_id = v_uid
       and id <> v_kid.id
  ) then
    raise exception 'auth_user_already_linked' using errcode = 'P0001';
  end if;

  update public.family_members
     set auth_user_id = v_uid,
         kid_joined_at = coalesce(kid_joined_at, now()),
         kid_join_code = null,
         kid_join_code_expires_at = null
   where id = v_kid.id;

  return query
    select v_kid.id, v_kid.family_id, v_kid.display_name;
end;
$$;

revoke execute on function public.generate_kid_join_code(uuid) from public, anon;
grant execute on function public.generate_kid_join_code(uuid) to authenticated;

revoke execute on function public.kid_link_with_join_code(text) from public, anon;
grant execute on function public.kid_link_with_join_code(text) to authenticated;
