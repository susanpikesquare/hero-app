-- Family-level reward setting. Defaults to 'hops' (bunny-themed) so new
-- families start with the on-brand kid-side game feel; parents can switch
-- to 'stars', 'badges' (badges-only, no count), or 'off' from /app/settings.
alter table public.families
  add column reward_mode text not null default 'hops'
    check (reward_mode in ('hops', 'stars', 'badges', 'off'));

comment on column public.families.reward_mode is
  'How the family wants chore completions rewarded for kids. hops/stars show a per-kid counter; badges shows milestone badges only; off hides the layer entirely.';
