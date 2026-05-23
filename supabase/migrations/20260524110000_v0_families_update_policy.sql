-- Parents can update their own family's row. Without this, UPDATEs were
-- silently filtered to zero rows by RLS — no error, no effect.
create policy "families: parents can update own"
  on public.families
  for update
  to authenticated
  using (
    id = public.current_user_family_id()
    and public.current_user_is_parent()
  )
  with check (
    id = public.current_user_family_id()
    and public.current_user_is_parent()
  );
