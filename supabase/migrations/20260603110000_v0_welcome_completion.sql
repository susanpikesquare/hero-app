-- Step 0 (Welcome / Arrival) completion timestamp on the family.
--
-- Per PRD §4¾ + the June 3 working session: before the parent sets up
-- their first kid, before they pick a chore, they get a brief welcome
-- moment that names the felt experience (Erica's verbatim copy:
-- "Endlessly frustrated, exhausted, and distanced from those you love
-- most.") and frames what the app is going to do for them.
--
-- This is one welcome per family/owner, not per kid. We use a timestamp
-- (not a boolean) so we can:
--   - Tell new families from migrated families ("never welcomed" vs
--     "welcomed during the v0 cohort")
--   - Re-surface the welcome moment after major product shifts
--     (set the column back to NULL for affected families)
--
-- /app/_layout.tsx redirects to /app/welcome when this is NULL, so the
-- welcome is the first thing a newly-signed-up parent sees.

alter table public.families
  add column if not exists parent_welcomed_at timestamptz;

comment on column public.families.parent_welcomed_at is
  'When the parent owner completed Step 0 / Welcome. NULL until completed. Used by the /app gate to redirect new families to /app/welcome.';
