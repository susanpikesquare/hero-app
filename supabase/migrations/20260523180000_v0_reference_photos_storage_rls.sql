-- reference-photos bucket: family-scoped read, parent-only write.
-- Path convention: <family_id>/<chore_id>/<ts>-<rand>.<ext>
-- The first folder segment is family_id, which gates access.

create policy "reference-photos: family can read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
  );

create policy "reference-photos: parents can insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
    and public.current_user_is_parent()
  );

create policy "reference-photos: parents can update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
    and public.current_user_is_parent()
  );

create policy "reference-photos: parents can delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'reference-photos'
    and (storage.foldername(name))[1] = public.current_user_family_id()::text
    and public.current_user_is_parent()
  );
