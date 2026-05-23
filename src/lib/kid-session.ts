/**
 * Kid session helper for the kid app surface.
 *
 * The kid's anonymous Supabase Auth session (created during join) is the
 * auth substrate. After kid_link_with_join_code() runs, the kid's
 * auth.uid() is stored as family_members.auth_user_id, which means RLS
 * naturally scopes their queries to their family.
 *
 * useKidSession resolves "who is this kid?" by reading the current auth
 * user and looking up their family_member row. Returns null kidRow if
 * the device hasn't joined yet (anon session exists but isn't linked).
 *
 * The /kid layout uses this to decide between rendering the kid home and
 * redirecting to /kid/join.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Database } from './database.types';
import { supabase } from './supabase';

export type KidRow = {
  id: string;
  family_id: string;
  display_name: string;
  age: number | null;
};

export type FamilyRow = Database['public']['Tables']['families']['Row'];

export type KidSessionState =
  | { status: 'loading' }
  | { status: 'no_session' }
  | { status: 'unlinked' } // anon session exists but no family_member yet
  | {
      status: 'ready';
      kid: KidRow;
      family: FamilyRow;
    };

export function useKidSession() {
  const [state, setState] = useState<KidSessionState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState({ status: 'no_session' });
      return;
    }

    // Resolve the family_member row linked to this auth user.
    const { data: kidRow, error: kidErr } = await supabase
      .from('family_members')
      .select('id, family_id, display_name, age, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (kidErr || !kidRow) {
      setState({ status: 'unlinked' });
      return;
    }
    if (kidRow.role !== 'kid') {
      // A parent auth user landed on /kid — shouldn't happen normally,
      // but treat as unlinked so /kid/_layout redirects them out.
      setState({ status: 'unlinked' });
      return;
    }

    const { data: family, error: famErr } = await supabase
      .from('families')
      .select('*')
      .eq('id', kidRow.family_id)
      .single();

    if (famErr || !family) {
      setState({ status: 'unlinked' });
      return;
    }

    setState({
      status: 'ready',
      kid: {
        id: kidRow.id,
        family_id: kidRow.family_id,
        display_name: kidRow.display_name,
        age: kidRow.age,
      },
      family,
    });
  }, []);

  useEffect(() => {
    load();
    // Watch for auth changes (sign-in, sign-out, anon link)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [load]);

  return { state, reload: load };
}

/**
 * Ensure the device has an authenticated Supabase user. If none, start an
 * anonymous session. Returns the user id.
 *
 * Used by /kid/join before redeeming a join code.
 */
export async function ensureAnonymousSession(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (error.message.toLowerCase().includes('anonymous')) {
      throw new Error(
        "Anonymous sign-ins aren't enabled on this Supabase project yet. Ask the parent to turn them on under Auth → Providers."
      );
    }
    throw error;
  }
  if (!data.user) throw new Error('Anonymous sign-in returned no user.');
  return data.user.id;
}

/**
 * Sign the device out of its anonymous session. Used by the "I'm not me /
 * use a different code" affordance on /kid/join.
 */
export async function clearKidSession(): Promise<void> {
  await supabase.auth.signOut();
}
