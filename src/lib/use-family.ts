/**
 * useFamily — loads the current user's family and roster, and exposes
 * actions for the parent dashboard. Talks to Supabase, respects RLS, and
 * keeps a single in-memory cache for the session.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Database } from './database.types';
import { supabase } from './supabase';

type Family = Database['public']['Tables']['families']['Row'];
type Member = Database['public']['Tables']['family_members']['Row'];

export type FamilyState = {
  family: Family | null;
  members: Member[];
  parent: Member | null;
  kids: Member[];
};

export function useFamily(enabled: boolean) {
  const [state, setState] = useState<FamilyState>({
    family: null,
    members: [],
    parent: null,
    kids: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: members, error: membersErr } = await supabase
      .from('family_members')
      .select('*');

    if (membersErr) {
      setError(membersErr.message);
      setLoading(false);
      return;
    }

    if (!members || members.length === 0) {
      setState({ family: null, members: [], parent: null, kids: [] });
      setLoading(false);
      return;
    }

    const familyId = members[0].family_id;
    const { data: family, error: familyErr } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (familyErr) {
      setError(familyErr.message);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const authId = userData.user?.id ?? null;
    const parent =
      members.find((m) => m.auth_user_id === authId && m.role === 'parent') ?? null;
    const kids = members.filter((m) => m.role === 'kid');

    setState({ family, members, parent, kids });
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addKid = useCallback(
    async (displayName: string) => {
      if (!state.family) throw new Error('No family loaded.');
      const { error: insertErr } = await supabase.from('family_members').insert({
        family_id: state.family.id,
        role: 'kid',
        display_name: displayName.trim(),
      });
      if (insertErr) throw insertErr;
      await reload();
    },
    [state.family, reload]
  );

  return { ...state, loading, error, reload, addKid };
}
