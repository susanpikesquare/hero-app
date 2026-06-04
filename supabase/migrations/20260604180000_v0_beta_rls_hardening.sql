-- Beta RLS hardening pass.
--
-- Three classes of fixes:
--   1. SIBLING ISOLATION (critical) — kids must only see their own
--      chores / submissions / instances, not their siblings'. Today's
--      policies are family-scoped, which means a kid signed into Alice's
--      account could SELECT Sam's chore submissions via direct API call.
--      PRD §6 explicitly forbids this.
--
--   2. ANON ROLE — new tables (chore_instances, parent_nudges) were
--      created with policies bound to the `public` role, which includes
--      anonymous. Functionally they deny because policies check
--      auth.uid(), but explicit `to authenticated` is the right hygiene.
--
--   3. INSERT WITH CHECK — several INSERT policies had `qual = null`,
--      meaning an authenticated user could POST a row with an arbitrary
--      family_id and bypass the family scope. Tightened with WITH CHECK
--      clauses that pin family_id to the caller's family.
--
-- Helper function `current_user_member_id()` returns the caller's own
-- family_members.id (if they have one), used by sibling-isolation
-- predicates.

create or replace function public.current_user_member_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.family_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

comment on function public.current_user_member_id is
  'The caller''s own family_members.id. Used in policies to scope a kid to their own rows.';

revoke all on function public.current_user_member_id() from public;
grant execute on function public.current_user_member_id() to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 1. CHORES — kid sees own only; parent sees all in family.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "chores: members can read own family" on public.chores;
create policy "chores: family-scoped, kid-isolated"
  on public.chores
  for select
  to authenticated
  using (
    family_id = current_user_family_id()
    and (
      current_user_is_parent()
      or kid_id = current_user_member_id()
    )
  );

-- Tighten parents-can-insert: must target their own family.
drop policy if exists "chores: parents can insert" on public.chores;
create policy "chores: parents insert into own family"
  on public.chores
  for insert
  to authenticated
  with check (
    family_id = current_user_family_id()
    and current_user_is_parent()
  );

-- ─────────────────────────────────────────────────────────────────────
-- 2. SUBMISSIONS — kid sees own only; parent sees all in family.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "submissions: members can read own family" on public.submissions;
create policy "submissions: family-scoped, kid-isolated"
  on public.submissions
  for select
  to authenticated
  using (
    chore_id in (
      select c.id from public.chores c
      where c.family_id = current_user_family_id()
        and (
          current_user_is_parent()
          or c.kid_id = current_user_member_id()
        )
    )
  );

-- Tighten insert: caller's chore must be in caller's family AND, if the
-- caller is a kid, must be assigned to that kid.
drop policy if exists "submissions: family can insert" on public.submissions;
create policy "submissions: family-scoped insert with kid isolation"
  on public.submissions
  for insert
  to authenticated
  with check (
    chore_id in (
      select c.id from public.chores c
      where c.family_id = current_user_family_id()
        and (
          current_user_is_parent()
          or c.kid_id = current_user_member_id()
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- 3. CHORE_INSTANCES — same kid-isolation, fix role to authenticated.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "family members read own family chore instances"
  on public.chore_instances;
drop policy if exists "family members update own family chore instances"
  on public.chore_instances;

create policy "chore_instances: family-scoped, kid-isolated read"
  on public.chore_instances
  for select
  to authenticated
  using (
    family_id = current_user_family_id()
    and (
      current_user_is_parent()
      or kid_id = current_user_member_id()
    )
  );

create policy "chore_instances: family-scoped, kid-isolated update"
  on public.chore_instances
  for update
  to authenticated
  using (
    family_id = current_user_family_id()
    and (
      current_user_is_parent()
      or kid_id = current_user_member_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- 4. PARENT_NUDGES — authenticated only; insert pins to family + parent.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "parent reads own family nudges" on public.parent_nudges;
drop policy if exists "parent inserts own family nudges" on public.parent_nudges;

create policy "parent_nudges: parents read own family"
  on public.parent_nudges
  for select
  to authenticated
  using (
    family_id = current_user_family_id()
    and current_user_is_parent()
  );

create policy "parent_nudges: parents insert into own family"
  on public.parent_nudges
  for insert
  to authenticated
  with check (
    family_id = current_user_family_id()
    and current_user_is_parent()
    and parent_id = current_user_member_id()
  );

-- ─────────────────────────────────────────────────────────────────────
-- 5. FAMILY_MEMBERS — tighten the no-WITH-CHECK insert.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "family_members: parents can insert kids" on public.family_members;
create policy "family_members: parents insert kids into own family"
  on public.family_members
  for insert
  to authenticated
  with check (
    family_id = current_user_family_id()
    and current_user_is_parent()
    and role = 'kid'
  );

-- ─────────────────────────────────────────────────────────────────────
-- 6. SECURITY DEFINER function hardening.
-- ─────────────────────────────────────────────────────────────────────

-- ensure_chore_instances_for_date: was callable by anon. The function
-- itself raises on auth.uid() is null, but better to lock at the grant
-- level so anon never reaches the function body.
revoke execute on function public.ensure_chore_instances_for_date(uuid, date) from public;
revoke execute on function public.ensure_chore_instances_for_date(uuid, date) from anon;
-- grant to authenticated is already in place from the original migration.

-- set_submission_actor_role: this is a trigger function. It should never
-- be RPC-callable. Revoke from every API role.
revoke execute on function public.set_submission_actor_role() from public;
revoke execute on function public.set_submission_actor_role() from anon;
revoke execute on function public.set_submission_actor_role() from authenticated;
