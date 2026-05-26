-- Per-chore coaching tips: up to 3 short ADHD-friendly bullets that
-- show up on the kid's chore tile so they don't have to remember what
-- "done" means for this chore. Capped at 3 in the UI; the DB allows
-- more for forward compatibility but the kid tile will only render 3.
--
-- Default empty array (not null) so existing chores and the chore
-- creation form don't need any code changes to keep working — they
-- just won't show any tips until the parent adds them.

alter table public.chores
  add column if not exists coaching_tips text[] not null default '{}'::text[];

comment on column public.chores.coaching_tips is
  'Up to 3 short ADHD-friendly bullets shown on the kid''s chore tile. Empty array = no tips.';
