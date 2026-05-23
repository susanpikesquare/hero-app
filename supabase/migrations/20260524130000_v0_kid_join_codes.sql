-- Per-kid join codes. Parent generates one, kid enters it on their device,
-- the device's anonymous Supabase Auth session gets linked to this
-- family_member via an RPC. Code is rotated/expired by regenerating.
alter table public.family_members
  add column kid_join_code text,
  add column kid_join_code_expires_at timestamptz,
  add column kid_joined_at timestamptz;

create unique index family_members_kid_join_code_unique
  on public.family_members (kid_join_code)
  where kid_join_code is not null;

comment on column public.family_members.kid_join_code is
  'One-time code a parent gives the kid to link their device. Set by generate_kid_join_code(), consumed by kid_link_with_join_code().';
comment on column public.family_members.kid_joined_at is
  'When this kid successfully linked a device via a join code. Null = never joined.';
