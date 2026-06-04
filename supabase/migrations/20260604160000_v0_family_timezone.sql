-- households operate in a single timezone (engineering-defaults §1).
-- Day boundary, reminder scheduling, and overdue logic all hinge on this.
--
-- Captured at signup from the parent device via
-- Intl.DateTimeFormat().resolvedOptions().timeZone (an IANA tz name like
-- 'America/Los_Angeles'). UTC default is a safe fallback for pre-existing
-- rows; the signup flow writes the real value.
--
-- Cross-device variance: when a kid signs in from a device in a
-- different tz, we still use the household's tz to evaluate "today" —
-- the kid sees the same Today list their parent does. Multi-tz
-- households are explicitly out of scope until multi-household lands.

alter table public.families
  add column if not exists timezone text not null default 'UTC';

comment on column public.families.timezone is
  'IANA timezone (e.g., America/Los_Angeles). Captured at signup. Day boundary + reminder scheduling use this.';
