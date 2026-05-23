-- Write back the AI verdict + feedback to a submission.
-- SECURITY DEFINER + locked down so only the service role can call it
-- (i.e., from the evaluate-submission edge function). The function
-- enforces verdict ∈ enum and trims the feedback string.
create or replace function public.update_submission_ai_result(
  p_submission_id uuid,
  p_verdict public.ai_verdict,
  p_feedback text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
  set
    ai_verdict = p_verdict,
    ai_feedback = nullif(trim(p_feedback), ''),
    ai_evaluated_at = now(),
    status = case
      when status = 'pending_ai' then 'pending_parent'::public.submission_status
      else status
    end
  where id = p_submission_id;
end;
$$;

-- Lock it down: only the service role bypasses RLS to call this.
revoke execute on function public.update_submission_ai_result(uuid, public.ai_verdict, text)
  from public, anon, authenticated;
grant execute on function public.update_submission_ai_result(uuid, public.ai_verdict, text)
  to service_role;
