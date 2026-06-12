-- Submissions DELETE policy.
--
-- v0 shipped submissions as append-only (see
-- 20260523010000_v0_submissions_insert_and_storage_rls.sql:45 — "No
-- delete or update policies in v0"). That turned out to silently break
-- two real flows, because a DELETE that matches no rows under RLS
-- returns success with zero rows affected (no error surfaced to the
-- client):
--
--   1. Self-attest UNDO (Susan QA, 2026-06-08): a kid taps a checklist
--      chore ("Brush teeth") and wants to undo a mis-tap. The client
--      issues a delete that RLS silently dropped, so the chore stayed
--      "done" forever.
--
--   2. F8 photo RETAKE: the kid/parent retake flow deletes the
--      just-created pending submission before re-uploading. That delete
--      was also silently failing, leaving an orphan submission row
--      behind on every retake.
--
-- This policy allows deleting ONLY undecided submissions
-- (parent_override IS NULL) within the caller's family, with the same
-- kid-isolation predicate used by the read/insert policies in
-- 20260604180000_v0_beta_rls_hardening.sql.
--
-- Why parent_override IS NULL:
--   - Self-attest passes have override = null  → undoable.
--   - Pending photo submissions have override = null → retakeable.
--   - Parent-DECIDED submissions (approved/rejected) keep override set,
--     so they stay immutable. A kid can't erase a parent's decision or
--     re-farm a reward by deleting + resubmitting an approved chore.
--
-- Both parents and the assigned kid can delete (same actors who can
-- insert). Sibling isolation holds: a kid can only reach rows for chores
-- assigned to them.

create policy "submissions: delete undecided own-family rows"
  on public.submissions
  for delete
  to authenticated
  using (
    parent_override is null
    and chore_id in (
      select c.id from public.chores c
      where c.family_id = current_user_family_id()
        and (
          current_user_is_parent()
          or c.kid_id = current_user_member_id()
        )
    )
  );
