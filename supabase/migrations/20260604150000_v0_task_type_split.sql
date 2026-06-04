-- Three task types (PRD §18).
--
-- Today `chores.verification_kind` is a 2-way enum: 'photo' or 'checklist'.
-- 'checklist' covers two distinct cases that should be split:
--
--   - photo_verification: kid submits a photo, AI evaluates. Today's
--     `verification_kind='photo'`.
--
--   - parent_verification: kid marks complete (no photo), parent confirms
--     in the queue before the chore counts as done. New. Use for homework,
--     instrument practice, "I read for 30 minutes."
--
--   - self_attest: kid marks complete, instantly counts as done, no
--     review. Use for self-care (brush teeth, shower) where the parent
--     trusts the report and photographing the kid would be wrong.
--
-- The existing 'photo' value becomes 'photo_verification'. The existing
-- 'checklist' value becomes 'self_attest' (most existing checklist
-- chores in the seeded data ARE self-care, and the no-review behavior
-- matches what's shipping today). Parents can edit a chore's task_type
-- afterward to upgrade brushed-teeth-from-self-attest to
-- piano-practice-as-parent-verification.
--
-- We add `task_type` as a new column rather than rewriting the enum,
-- because rewriting an in-use enum requires a multi-step pg dance. The
-- new column gets backfilled from verification_kind; the old column
-- stays for a release cycle as the source of truth for the AI pipeline
-- (then we deprecate).

create type public.task_type as enum (
  'photo_verification',
  'parent_verification',
  'self_attest'
);

alter table public.chores
  add column if not exists task_type public.task_type;

-- Backfill from the existing verification_kind. Idempotent.
update public.chores
   set task_type = case
     when verification_kind = 'photo' then 'photo_verification'::public.task_type
     when verification_kind = 'checklist' then 'self_attest'::public.task_type
   end
 where task_type is null;

alter table public.chores
  alter column task_type set not null,
  alter column task_type set default 'photo_verification';

comment on column public.chores.task_type is
  'PRD §18 task type. photo_verification: AI checks photo. parent_verification: parent confirms a mark-complete. self_attest: mark-complete, no review. verification_kind is the legacy column it backfills from.';
