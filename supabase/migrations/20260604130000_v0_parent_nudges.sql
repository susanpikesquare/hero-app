-- Parent nudge log (per Erica's June 3 ask + PRD §4¾).
--
-- Tracks each time a parent sends a gentle nudge to one of their kids.
-- Used for two things:
--   1. The "you've nudged 3+ times today" metacognition callout
--      (Erica's idea — the AI surfaces a parent-coaching prompt when
--      the same kid is being nudged repeatedly in a day).
--   2. Computing the kid-initiated metric (PRD §3) — a kid completion
--      that happens within N minutes of a parent nudge is parent-prompted,
--      not kid-initiated.
--
-- Row per nudge. Cheap to log, cheap to query.

create table public.parent_nudges (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  parent_id  uuid not null references public.family_members(id) on delete cascade,
  kid_id     uuid not null references public.family_members(id) on delete cascade,
  nudged_at  timestamptz not null default now()
);

create index parent_nudges_kid_day
  on public.parent_nudges (kid_id, nudged_at desc);

comment on table public.parent_nudges is
  'Log of parent gentle-nudges to a kid. Used for nudge-metacognition (Erica June 3 ask) and the kid-initiated metric (PRD §3).';

-- RLS: a parent can read + insert nudge rows for kids in their own family.
alter table public.parent_nudges enable row level security;

create policy "parent reads own family nudges"
  on public.parent_nudges
  for select
  using (
    family_id in (
      select fm.family_id from public.family_members fm
      where fm.auth_user_id = auth.uid() and fm.role = 'parent'
    )
  );

create policy "parent inserts own family nudges"
  on public.parent_nudges
  for insert
  with check (
    family_id in (
      select fm.family_id from public.family_members fm
      where fm.auth_user_id = auth.uid() and fm.role = 'parent'
    )
  );
