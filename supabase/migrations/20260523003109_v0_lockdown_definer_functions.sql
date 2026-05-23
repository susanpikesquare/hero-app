-- Revoke the implicit PUBLIC EXECUTE grant on SECURITY DEFINER functions
-- so anon (unauthenticated) callers cannot hit them via /rest/v1/rpc.
-- Authenticated users still have the explicit grant from the previous migration.

revoke execute on function public.current_user_family_id() from public, anon;
revoke execute on function public.current_user_is_parent() from public, anon;
revoke execute on function public.redeem_invite_and_create_family(text, text, text) from public, anon;
