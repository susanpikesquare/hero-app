-- Enable RLS on every public table. Default-deny.
alter table public.invite_codes enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.chores enable row level security;
alter table public.submissions enable row level security;

-- Helper: returns the family_id of the currently authenticated user, or null.
-- SECURITY DEFINER so RLS-on-family_members doesn't trip our own check.
create or replace function public.current_user_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id
  from public.family_members
  where auth_user_id = auth.uid()
  limit 1
$$;

-- Helper: is the current user a parent in their family?
create or replace function public.current_user_is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where auth_user_id = auth.uid() and role = 'parent'
  )
$$;

grant execute on function public.current_user_family_id() to authenticated;
grant execute on function public.current_user_is_parent() to authenticated;

-- invite_codes: no direct client access. Reads and writes only via SECURITY DEFINER RPCs.
-- (No policies = default deny under RLS.)

-- families: a family can read its own row; only updates via RPC.
create policy "families: members can read own"
  on public.families
  for select
  to authenticated
  using (id = public.current_user_family_id());

-- family_members: members can read their own family's roster.
create policy "family_members: members can read own family"
  on public.family_members
  for select
  to authenticated
  using (family_id = public.current_user_family_id());

-- family_members: parents can add kids in their own family.
create policy "family_members: parents can insert kids"
  on public.family_members
  for insert
  to authenticated
  with check (
    family_id = public.current_user_family_id()
    and role = 'kid'
    and public.current_user_is_parent()
  );

-- family_members: parents can update kid rows in their own family
-- (but cannot rewrite auth_user_id or role — enforced separately if needed).
create policy "family_members: parents can update own family"
  on public.family_members
  for update
  to authenticated
  using (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  )
  with check (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  );

-- family_members: parents can delete kids.
create policy "family_members: parents can delete kids"
  on public.family_members
  for delete
  to authenticated
  using (
    family_id = public.current_user_family_id()
    and role = 'kid'
    and public.current_user_is_parent()
  );

-- chores: read in own family
create policy "chores: members can read own family"
  on public.chores
  for select
  to authenticated
  using (family_id = public.current_user_family_id());

-- chores: parents can write
create policy "chores: parents can insert"
  on public.chores
  for insert
  to authenticated
  with check (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  );

create policy "chores: parents can update"
  on public.chores
  for update
  to authenticated
  using (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  )
  with check (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  );

create policy "chores: parents can delete"
  on public.chores
  for delete
  to authenticated
  using (
    family_id = public.current_user_family_id()
    and public.current_user_is_parent()
  );

-- submissions: members can read submissions for chores in their own family
create policy "submissions: members can read own family"
  on public.submissions
  for select
  to authenticated
  using (
    chore_id in (
      select id from public.chores
      where family_id = public.current_user_family_id()
    )
  );
-- (No insert/update policies for submissions in v0 — client cannot write yet.)
