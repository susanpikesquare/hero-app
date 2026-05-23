-- Optional jobs: chores parents post as "extra to earn more." They show in
-- a separate Extra jobs section in kid mode and can be weighted higher than
-- regular daily chores.
alter table public.chores
  add column is_optional boolean not null default false,
  add column reward_weight smallint not null default 1
    check (reward_weight between 1 and 10);

comment on column public.chores.is_optional is
  'True for chores the parent has posted as optional "extra jobs" the kid can pick up.';
comment on column public.chores.reward_weight is
  'How many hops/stars a single win on this chore is worth. Defaults to 1 for regular chores; optional jobs typically 2-3.';
