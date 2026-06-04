-- Week-one conflict-reduction check-in (Workbook Q2.1 + PRD §3).
--
-- Erica's success criterion for the first week is, in part, "There was a
-- reduction in conflict / arguing." The product can't measure conflict
-- directly — but a single Likert question to the parent at the end of
-- week one closes the loop on the north-star outcome ("reduced household
-- friction") that would otherwise be unmeasurable.
--
-- Schema:
--   - `week_one_checkin_shown_at`  — when the check-in surfaced
--   - `week_one_checkin_answer`    — the parent's response (Likert 3)
--   - `week_one_checkin_answered_at` — when they answered
--
-- Lives on the families table because the check-in is a per-household
-- moment, not a per-kid one — Erica's framing of Home Hero as a "family
-- operating system" (Workbook Q2.2) extends to the activation metric.
--
-- The gate (when to show it) is in /app/_layout.tsx: when
-- `parent_welcomed_at` is non-null + the family was created ≥ 7 days
-- ago + this column is still null, redirect once to a one-question
-- screen.

create type public.week_one_answer as enum (
  'less_conflict',
  'about_the_same',
  'more_conflict'
);

alter table public.families
  add column if not exists week_one_checkin_shown_at timestamptz,
  add column if not exists week_one_checkin_answer public.week_one_answer,
  add column if not exists week_one_checkin_answered_at timestamptz;

comment on column public.families.week_one_checkin_shown_at is
  'When the end-of-week-1 conflict check-in was surfaced to the parent. NULL until shown.';
comment on column public.families.week_one_checkin_answer is
  'Parent-reported direction of conflict in the first week (Workbook Q2.1). Closes the loop on the conflict-reduction MVP outcome.';
comment on column public.families.week_one_checkin_answered_at is
  'When the parent answered the week-1 check-in. NULL until answered.';
