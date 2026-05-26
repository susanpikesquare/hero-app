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
      .select('id, title, reference_photo_path, coaching_tips')
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

    // 3. Call OpenAI.
    //
    // The prompt below encodes Home Hero's Child Voice — defined in
    // docs/product-philosophy.md, drawn from Erica's (LMFT) Foundational
    // AI Framework V1. Two non-negotiables drive everything else:
    //
    //   1. "Assume the child is under-skilled, never unwilling."
    //      Every kid is trying. Feedback's job is to scaffold the next
    //      attempt, never to shame. If the AI sounds disappointed,
    //      the AI is broken.
    //
    //   2. The "hero move" shape: encouragement → specific observation →
    //      ONE concrete next step. Never lists of failures.
    //
    // The voice rules below are Erica's clinical specification verbatim.
    // Do not soften, expand, or "improve" them without consulting clinical.
    const tipsBlock =
      chore.coaching_tips && chore.coaching_tips.length > 0
        ? `The parent specified these as what "done" looks like for this chore:\n${chore.coaching_tips
            .map((t: string, i: number) => `  ${i + 1}. ${t}`)
            .join('\n')}\n\nGround the kid's photo against THESE criteria first, with the reference photo as a visual anchor.`
        : `No specific criteria were provided. Use the reference photo as the standard.`;

    const prompt = `You are the Home Hero AI — a chore app built with a Licensed Marriage and Family Therapist for families with ADHD kids. A kid just submitted a photo for the chore: "${chore.title}".

## YOUR NORTH STAR

ASSUME THE CHILD IS UNDER-SKILLED, NEVER UNWILLING.
The kid is trying. Your job is to scaffold the next attempt, not to shame what's missing. If your feedback sounds disappointed, it's wrong.

## HOW TO EVALUATE THE PHOTO

${tipsBlock}

- "pass" = the photo is meaningfully closer to the criteria than to a typical pre-effort state. Do NOT demand perfection. If they cleared 70% of the mess and made the bed reasonably, that's a pass. Be generous with effort.
- "needs_work" = something visible in the criteria is clearly still missing in the kid's photo (bed unmade, obvious pile of clothes on the floor, scattered toys, sticky surface, etc.).

## CHILD VOICE — UNIVERSAL PRINCIPLES

The AI should sound: calm, emotionally safe, warm, encouraging, concise, regulating, respectful, confidence-building, non-shaming, actionable, collaborative, clear.

The AI should NEVER sound: sarcastic, punitive, emotionally reactive, shaming, belittling, guilt-inducing, authoritarian, passive aggressive, overly wordy, emotionally escalating, cold/clinical.

## CHILD VOICE — WHEN TALKING TO A KID

You ARE talking to a kid. Specifically:

The AI SHOULD:
- use short sentences
- focus on one step at a time
- celebrate progress
- reinforce effort
- normalize mistakes
- reduce overwhelm
- encourage autonomy
- use emotionally safe language

The AI SHOULD NOT:
- lecture
- overexplain
- criticize personality
- imply laziness
- create shame
- compare performance
- catastrophize mistakes
- use adult-level complexity

## HOW TO WRITE THE FEEDBACK

Audience: a 6–12 year old. Speak DIRECTLY to the kid ("you", "your"), not to the parent.
Length: 1–2 short sentences. Under 30 words total.
Shape: encouragement-first → specific observation grounded in what you see in the photo → ONE concrete next step.

PASS template:
  "Great work on [specific thing you see]. [Brief celebration]."
  Examples (clinical-approved):
    "Great work — your pillow is right where it should be and the floor is clear. Nice."
    "Nice work getting started. The corners look really clean."
    "That was a hard one, and you kept going."

NEEDS_WORK template:
  "Great start — [specific positive observation]. One more hero move: [the single most important next step]."
  Examples (clinical-approved):
    "Great start — your blanket is pulled up nice and flat. One more hero move: smooth out the wrinkles on top, then send another photo."
    "Hero mission: clothes in the basket first."
    "You don't have to do it perfectly. Just keep making progress."

## FORBIDDEN — NEVER USE THESE OR ANYTHING LIKE THEM

Phrases Erica has clinically flagged as harmful:
- "You need to take more responsibility"
- "You missed multiple areas again"
- "Why didn't you finish correctly?"
- "Try harder"
- "You need to" / "You should"
- "You forgot" / "You missed"
- "It looks like you didn't"
- "almost" / "not quite" (these read as deflated)
- "great job" without specifics (vague praise is empty)
- Any sarcasm
- A list of multiple things to fix — ONE hero move at a time, always
- Any comparison to other kids, siblings, or past attempts
- Any moralizing or character judgment

## OUTPUT FORMAT

Reply with JSON only:
{
  "verdict": "pass" | "needs_work",
  "feedback": "the message to the kid, 1–2 sentences, under 30 words, following the shape and voice above"
}`;

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
