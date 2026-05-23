-- Lightweight pre-check used by the /signup form to validate the invite code
-- BEFORE sending a magic link. Returns boolean only; reveals no other info.
-- Long random codes prevent brute force in practice.
create or replace function public.peek_invite_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invite_codes
    where code = trim(p_code)
      and revoked = false
      and (expires_at is null or expires_at > now())
      and times_used < max_uses
  )
$$;

-- Anyone (including pre-login) can probe; rate limit via Supabase if needed later.
revoke execute on function public.peek_invite_code(text) from public;
grant execute on function public.peek_invite_code(text) to anon, authenticated;
