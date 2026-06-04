-- Per-kid display mode. One Home Hero account holds kids at very
-- different developmental stages — a 7-year-old and a 16-year-old share
-- the same parent dashboard but should NOT share the same kid surface.
-- The 6-12 surface (mascot, "hero" framing, soft illustration) reads
-- babyish at 14+; teens disengage.
--
-- The four modes:
--   auto  → resolves at render time from the kid's age. Default for new
--           kids. Picks `kid` for ages < 13, `teen` for 13-15, `peer` for
--           16-18.
--   kid   → force the 6-12 voice (bunny, "hero," coached scaffolding).
--   teen  → 13-15 voice. Peer/coach tone, no mascot, transactional CTAs.
--   peer  → 16-18 voice. Flattest, most matter-of-fact. Closer to a
--           shared family operating system than a chore app.
--
-- We let the parent override `auto` per kid because a precocious
-- 11-year-old may want teen mode and a 14-year-old who still loves the
-- bunny should be allowed to keep it. Developmental difference, not
-- birthday-determinism — see Erica's framework V1.

create type public.kid_mode as enum ('auto', 'kid', 'teen', 'peer');

alter table public.family_members
  add column if not exists kid_mode public.kid_mode not null default 'auto';

comment on column public.family_members.kid_mode is
  'Display mode for the kid surface. auto resolves from age (kid <13, teen 13-15, peer 16-18). Parent can override per kid in Settings.';
