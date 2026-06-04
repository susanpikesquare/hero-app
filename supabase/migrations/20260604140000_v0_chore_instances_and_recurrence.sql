-- TaskInstance refactor (PRD §12 + §19).
--
-- Splits the durable chore *definition* from its day-to-day status. Today
-- the `chores` table conflates both: a row represents "the existence of
-- this chore for this kid," and the kid's status against it is computed
-- on read by scanning submissions. That works for daily-only chores but
-- can't represent:
--   - A weekly chore that's "missed" rather than "not yet" on Tuesday
--     when it was due Monday.
--   - Recurrence patterns more nuanced than every day.
--   - The PRD's TaskInstance object the dashboard 3-zone is built around.
--
-- We add:
--   1. Recurrence columns on `chores` — recurrence_type + recurrence_days
--      + starts_on. Default `recurrence_type='daily'` so existing chores
--      keep their current behavior unchanged.
--   2. A `chore_instances` table — one row per (chore_id, due_date) with
--      its own status. Generated lazily on read (see the
--      `ensure_chore_instances_for_today` RPC in the next migration).
--   3. A `task_instance_id` on submissions — submissions are now
--      attached to a specific instance, not just to a chore. Nullable
--      for backfill compatibility.
--
-- Naming note: the codebase uses "chore" everywhere. PRD calls these
-- "Task" and "TaskInstance." We keep "chore" / "chore_instance" so this
-- migration doesn't trigger a 30+ file rename. Semantically identical.

create type public.recurrence_type as enum (
  'none',     -- one-time task
  'daily',    -- every day
  'weekly'    -- specific weekdays (recurrence_days)
);

create type public.instance_status as enum (
  'open',             -- due, no submission yet
  'submitted',        -- kid has submitted, AI not yet decided
  'awaiting_parent',  -- routed to parent queue
  'passed',           -- AI passed
  'complete',         -- parent confirmed / self-attest done
  'missed'            -- past due_date without completion
);

-- 1. Recurrence on chores.
alter table public.chores
  add column if not exists recurrence_type public.recurrence_type
    not null default 'daily',
  add column if not exists recurrence_days int[]
    not null default '{}'::int[],
  add column if not exists starts_on date
    not null default current_date;

comment on column public.chores.recurrence_type is
  'How this chore recurs. none=one-time, daily=every day, weekly=specific weekdays in recurrence_days.';
comment on column public.chores.recurrence_days is
  'For weekly recurrence: array of ISO weekday ints (1=Monday, 7=Sunday). Empty for non-weekly.';
comment on column public.chores.starts_on is
  'First date this chore is due. Instances are not generated for dates before this.';

-- Check constraint: weekly recurrence requires non-empty recurrence_days.
alter table public.chores
  add constraint chores_weekly_has_days
  check (
    recurrence_type <> 'weekly'
    or cardinality(recurrence_days) > 0
  );

-- 2. ChoreInstances — one row per (chore_id, due_date).
create table public.chore_instances (
  id            uuid primary key default gen_random_uuid(),
  chore_id      uuid not null references public.chores(id) on delete cascade,
  kid_id        uuid not null references public.family_members(id) on delete cascade,
  family_id     uuid not null references public.families(id) on delete cascade,
  due_date      date not null,
  status        public.instance_status not null default 'open',
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- Idempotency: never generate two instances for the same chore on the
-- same date. Lazy-generation code can blindly attempt the insert and
-- ignore the conflict.
create unique index chore_instances_chore_date
  on public.chore_instances (chore_id, due_date);

-- Lookup paths.
create index chore_instances_family_date
  on public.chore_instances (family_id, due_date);
create index chore_instances_kid_date
  on public.chore_instances (kid_id, due_date);

comment on table public.chore_instances is
  'One occurrence of a chore on a specific date. Generated lazily — see ensure_chore_instances_for_today() RPC.';

-- 3. Submissions ← instance.
alter table public.submissions
  add column if not exists chore_instance_id uuid
    references public.chore_instances(id) on delete set null;

comment on column public.submissions.chore_instance_id is
  'The specific instance this submission resolves. Nullable for back-compat with submissions made before the instance refactor; new submissions should always set this.';

create index submissions_instance
  on public.submissions (chore_instance_id);

-- RLS for chore_instances. Mirrors the chores policy: members of the
-- family can read; the system (definer functions) writes.
alter table public.chore_instances enable row level security;

create policy "family members read own family chore instances"
  on public.chore_instances
  for select
  using (
    family_id in (
      select fm.family_id from public.family_members fm
      where fm.auth_user_id = auth.uid()
    )
  );

create policy "family members update own family chore instances"
  on public.chore_instances
  for update
  using (
    family_id in (
      select fm.family_id from public.family_members fm
      where fm.auth_user_id = auth.uid()
    )
  );
