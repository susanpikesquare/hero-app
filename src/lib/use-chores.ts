/**
 * useChores — loads chores + recent submissions for the current family.
 * RLS scopes everything to the user's family automatically.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Database } from './database.types';
import { supabase } from './supabase';

export type Chore = Database['public']['Tables']['chores']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];

export function useChores(enabled: boolean) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [choresRes, subsRes] = await Promise.all([
      supabase.from('chores').select('*').eq('active', true).order('created_at'),
      supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50),
    ]);

    if (choresRes.error) {
      setError(choresRes.error.message);
      setLoading(false);
      return;
    }
    if (subsRes.error) {
      setError(subsRes.error.message);
      setLoading(false);
      return;
    }

    setChores(choresRes.data ?? []);
    setSubmissions(subsRes.data ?? []);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addChore = useCallback(
    async (opts: {
      familyId: string;
      kidId: string;
      title: string;
      kind: string;
      isOptional?: boolean;
      rewardWeight?: number;
    }) => {
      const { error: insertErr } = await supabase.from('chores').insert({
        family_id: opts.familyId,
        kid_id: opts.kidId,
        title: opts.title.trim(),
        kind: opts.kind,
        is_optional: opts.isOptional ?? false,
        reward_weight: opts.rewardWeight ?? 1,
      });
      if (insertErr) throw insertErr;
      await reload();
    },
    [reload]
  );

  return { chores, submissions, loading, error, reload, addChore };
}

export function submissionsForChore(
  submissions: Submission[],
  choreId: string
): Submission[] {
  return submissions.filter((s) => s.chore_id === choreId);
}

export function choresForKid(chores: Chore[], kidId: string): Chore[] {
  return chores.filter((c) => c.kid_id === kidId);
}
