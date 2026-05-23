-- Age of the kid in years. Nullable for backwards compatibility with
-- kids added before the field existed. Parents update via the dashboard.
alter table public.family_members
  add column age smallint
  check (age is null or (age >= 0 and age <= 25));

comment on column public.family_members.age is
  'Age in years. Used to suggest age-appropriate chores during setup. Null when unknown.';
