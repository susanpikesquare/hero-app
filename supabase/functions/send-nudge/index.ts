/**
 * send-nudge edge function.
 *
 * Fired by the parent when they tap "Gentle nudge" on a kid card. The
 * function:
 *   1. Verifies (via the caller's JWT + RLS) that the caller is a PARENT
 *      in the same family as the target kid.
 *   2. Uses the service role to look up the kid's registered Expo push
 *      tokens (device_push_tokens) — these are written by the kid's own
 *      device on the /kid home screen.
 *   3. Sends an encouragement-first push via the Expo Push API.
 *
 * No third-party secret required — the Expo Push API is unauthenticated
 * for sending to tokens minted under this project. SUPABASE_URL /
 * SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by the
 * platform.
 *
 * Returns { sent: N } — the number of devices the nudge was pushed to.
 * Zero is a normal result (the kid hasn't opened the app on their own
 * device yet, or declined notifications) — NOT an error.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

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

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResp({ error: 'unauthorized' }, 401);
    }

    const body = (await req.json().catch(() => null)) as
      | { kid_id?: string }
      | null;
    const kidId = body?.kid_id;
    if (!kidId) {
      return jsonResp({ error: 'kid_id required' }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ── 1. Verify the caller is a parent in the kid's family. ──────────
    // User-scoped client (RLS active): the parent can only read members
    // of their own family, so a successful lookup of BOTH the caller's
    // parent row and the kid row in the same family proves authorization.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResp({ error: 'unauthorized' }, 401);
    }
    const callerUid = userData.user.id;

    const { data: caller } = await userClient
      .from('family_members')
      .select('id, family_id, role, display_name')
      .eq('auth_user_id', callerUid)
      .eq('role', 'parent')
      .maybeSingle();
    if (!caller) {
      return jsonResp({ error: 'not a parent' }, 403);
    }

    const { data: kid } = await userClient
      .from('family_members')
      .select('id, family_id, role, display_name')
      .eq('id', kidId)
      .maybeSingle();
    if (!kid || kid.role !== 'kid' || kid.family_id !== caller.family_id) {
      return jsonResp({ error: 'kid not in your family' }, 403);
    }

    // ── 2. Look up the kid's push tokens (service role). ───────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tokenRows } = await adminClient
      .from('device_push_tokens')
      .select('expo_push_token')
      .eq('member_id', kidId);

    const tokens = (tokenRows ?? [])
      .map((r: { expo_push_token: string }) => r.expo_push_token)
      .filter(Boolean);

    if (tokens.length === 0) {
      // Not an error — the kid just hasn't registered a device yet.
      return jsonResp({ sent: 0, reason: 'no_registered_devices' });
    }

    // ── 3. Send via the Expo Push API. ─────────────────────────────────
    const parentName = (caller.display_name as string) || 'Your grown-up';
    const messages = tokens.map((to: string) => ({
      to,
      sound: 'default',
      title: '👋 A nudge from your grown-up',
      body: `${parentName} is cheering you on — ready for today's hero work?`,
      data: { type: 'nudge' },
    }));

    const pushResp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!pushResp.ok) {
      const text = await pushResp.text().catch(() => '');
      return jsonResp(
        { error: 'expo_push_failed', status: pushResp.status, detail: text },
        502
      );
    }

    return jsonResp({ sent: tokens.length });
  } catch (err) {
    return jsonResp(
      { error: 'unhandled', detail: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
