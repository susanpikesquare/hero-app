/**
 * evaluate-submission edge function.
 *
 * Triggered (fire-and-forget) by the kid client right after a photo submission
 * is inserted. The function:
 *   1. Verifies the caller belongs to the submission's family (via RLS-checked
 *      SELECT on the submission row using the caller's JWT)
 *   2. Uses the service role to fetch the chore + reference photo, build short-
 *      lived signed URLs, call OpenAI gpt-4o-mini with vision
 *   3. Writes the AI verdict + feedback back via the SECURITY DEFINER RPC
 *      update_submission_ai_result, which only the service role can invoke
 *
 * Required Supabase secret: OPENAI_API_KEY
 * (Set with: `supabase secrets set OPENAI_API_KEY=sk-...`)
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

type AiVerdict = 'pass' | 'needs_work';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResp({ error: 'unauthorized' }, 401);
    }

    const body = (await req.json().catch(() => null)) as { submission_id?: string } | null;
    const submission_id = body?.submission_id;
    if (!submission_id) {
      return jsonResp({ error: 'submission_id required' }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      return jsonResp(
        { error: 'OPENAI_API_KEY is not set as a Supabase secret' },
        500
      );
    }

    // 1. Authorize: the caller must be able to SELECT this submission under
    //    their own RLS scope (which means they're a member of the family).
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: subRow, error: subErr } = await userClient
      .from('submissions')
      .select('id, chore_id, photo_path')
      .eq('id', submission_id)
      .single();

    if (subErr || !subRow) {
      return jsonResp({ error: 'submission not found or no access' }, 404);
    }

    // 2. Service-role client for reading chore + signing URLs + writing back.
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: chore, error: choreErr } = await sb
      .from('chores')
      .select('id, title, reference_photo_path')
      .eq('id', subRow.chore_id)
      .single();

    if (choreErr || !chore) {
      return jsonResp({ error: 'chore not found' }, 404);
    }

    if (!chore.reference_photo_path) {
      // No reference yet — can't compare. Don't error; the submission just
      // stays without an AI verdict, and the parent reviews manually.
      return jsonResp({ ok: false, reason: 'no_reference_photo' });
    }

    const [refSign, subSign] = await Promise.all([
      sb.storage
        .from('reference-photos')
        .createSignedUrl(chore.reference_photo_path, 60 * 5),
      sb.storage.from('submissions').createSignedUrl(subRow.photo_path, 60 * 5),
    ]);

    if (refSign.error || !refSign.data || subSign.error || !subSign.data) {
      return jsonResp(
        {
          error: 'could not sign URLs',
          ref: refSign.error?.message,
          sub: subSign.error?.message,
        },
        500
      );
    }

    // 3. Call OpenAI. Encouragement-first feedback is non-negotiable
    //    per Erica's "see the effort, then guide" rule.
    const prompt = `You're reviewing a kid's chore photo. Compare the kid's submitted photo to the reference photo of what "${chore.title}" looks like when it's properly done.

Reply with JSON only:
{
  "verdict": "pass" or "needs_work",
  "feedback": "1-2 short sentences spoken DIRECTLY to the kid. Encouragement-first ('I can see your effort here…'). Specific about what looks great. Never punitive, never sarcastic, never harsh. Use everyday words a 6-12 year old understands."
}

Pass = the kid's photo is meaningfully closer to the reference than to a typical messy room. Don't demand perfection.
Needs work = something obvious still doesn't match the reference (bed unmade, clothes on the floor, big mess of toys visible, etc.). Even then, the feedback must celebrate effort and point to ONE thing to focus on, not a list of failures.`;

    const openaiResp = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'text', text: "Reference (what done looks like):" },
                {
                  type: 'image_url',
                  image_url: { url: refSign.data.signedUrl, detail: 'high' },
                },
                { type: 'text', text: "Kid's submitted photo:" },
                {
                  type: 'image_url',
                  image_url: { url: subSign.data.signedUrl, detail: 'high' },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      console.error('OpenAI error:', errText);
      return jsonResp(
        { error: 'openai call failed', status: openaiResp.status, detail: errText },
        500
      );
    }

    const openaiJson = (await openaiResp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const message = openaiJson.choices?.[0]?.message?.content;
    if (!message) {
      return jsonResp({ error: 'openai returned no content' }, 500);
    }

    let parsed: { verdict?: string; feedback?: string };
    try {
      parsed = JSON.parse(message);
    } catch {
      return jsonResp(
        { error: 'openai returned non-JSON', raw: message },
        500
      );
    }

    const verdict: AiVerdict = parsed.verdict === 'pass' ? 'pass' : 'needs_work';
    const feedback = (parsed.feedback ?? '').trim();

    const { error: rpcErr } = await sb.rpc('update_submission_ai_result', {
      p_submission_id: submission_id,
      p_verdict: verdict,
      p_feedback: feedback,
    });
    if (rpcErr) {
      return jsonResp({ error: 'writeback failed', detail: rpcErr.message }, 500);
    }

    return jsonResp({ ok: true, verdict, feedback });
  } catch (err) {
    console.error('evaluate-submission unhandled error', err);
    return jsonResp({ error: String(err) }, 500);
  }
});
