-- Allow authenticated family members to insert submissions for chores
-- in their own family. submitted_by must reference one of the family's
-- members (parent OR kid — in v0 kid mode runs under parent's session,
-- but submitted_by tags WHICH family_member did the submitting).
create policy "submissions: family can insert"
  on public.submissions
  for insert
  to authenticated
  with check (
    chore_id in (
      select id from public.chores
      where family_id = public.current_user_family_id()
    )
    and (
      submitted_by is null
      or submitted_by in (
        select id from public.family_members
        where family_id = public.current_user_family_id()
      )
    )
  );

-- Storage RLS for the submissions bucket.
-- Path convention: <family_id>/<kid_id>/<chore_id>/<filename>
-- The first folder segment is the family_id, which gates access.

create policy "submissions storage: family can read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
  );

create policy "submissions storage: family can insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
  );

-- (No delete or update policies in v0 — submissions are append-only.)
