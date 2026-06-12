-- Device push tokens — Expo push notification registration.
--
-- Each row is one (member, device) push token. A kid registers their
-- Expo push token from their own device on the /kid home screen; the
-- send-nudge Edge Function reads these (service role) to deliver a
-- parent's nudge to the kid's phone.
--
-- A member manages ONLY their own tokens (current_user_member_id()).
-- The Edge Function uses the service role, which bypasses RLS, to read
-- a kid's tokens when a parent in the same family fires a nudge.

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.family_members(id) on delete cascade,
  expo_push_token text not null,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, expo_push_token)
);

create index if not exists device_push_tokens_member_idx
  on public.device_push_tokens (member_id);

alter table public.device_push_tokens enable row level security;

-- A member can read/insert/update/delete only their own token rows.
-- current_user_member_id() resolves the caller's family_members.id from
-- auth.uid() (kids are linked via kid_link_with_join_code, so this works
-- for the anonymous kid session too).
drop policy if exists "push_tokens: member manages own" on public.device_push_tokens;
create policy "push_tokens: member manages own"
  on public.device_push_tokens
  for all
  to authenticated
  using (member_id = public.current_user_member_id())
  with check (member_id = public.current_user_member_id());
