-- Optional, parent-provided context for each kid.
--
-- Home Hero is a universal product (PRD v0.3.1 §2, §8A). It serves every
-- kid, neurotypical or neurodivergent. We do not diagnose, label, or
-- categorize a child. We do, however, let a parent OPTIONALLY tell us
-- their child is neurodivergent, because that context legitimately
-- changes what we suggest, how we pace it, and what coaching we
-- surface — for the PARENT, never visible to the child.
--
-- Rules (PRD §8A):
--   - The context is OPTIONAL. `not_specified` and `not_specified`-as-
--     intent are first-class and never block setup.
--   - Specific profiles (ADHD, autism, anxiety, sensory) are Later, per
--     Workbook parking lot. MVP captures a single general context only.
--   - The context is PARENT-FACING ONLY. It seeds support defaults and
--     surfaces relevant coaching. It is NEVER shown to the child as a
--     label and MUST NEVER appear in any child session payload
--     (server-side enforcement is a separate task; this migration only
--     models the data).
--
-- The migration is additive: existing kids default to `not_specified`,
-- which behaves exactly as today's app does. Wiring per-context support
-- defaults waits on Erica's answers to Workbook Q5.4 + Q5.5; the field
-- ships now so the data is captured even before the defaults exist.

create type public.neurodivergence_context as enum (
  'not_specified',
  'neurotypical',
  'neurodivergent'
);

alter table public.family_members
  add column if not exists neurodivergence_context
    public.neurodivergence_context
    not null
    default 'not_specified';

comment on column public.family_members.neurodivergence_context is
  'Optional parent-provided context (PRD §8A). Seeds support defaults and surfaces relevant coaching. PARENT-FACING ONLY — must never appear in child session payloads.';
