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
      /** Defaults to 'daily' (existing behavior). */
      recurrenceType?: 'none' | 'daily' | 'weekly';
      /** Required if recurrenceType is 'weekly'. ISO weekdays: 1=Mon..7=Sun. */
      recurrenceDays?: number[];
      /** PRD §18 task type. Defaults to 'photo_verification'. */
      taskType?:
        | 'photo_verification'
        | 'parent_verification'
        | 'self_attest';
      /** Free-form tips the kid sees on their chore tile. One string per
       *  bullet — most parents enter one tip per line in the UI, then we
       *  split before passing in. */
      coachingTips?: string[];
      /** Path inside the reference-photos storage bucket. Set after a
       *  successful upload — leave undefined to create a chore without a
       *  reference photo (parent can add one later from the edit screen). */
      referencePhotoPath?: string | null;
    }): Promise<string | null> => {
      // Keep verification_kind in sync with task_type for the duration the
      // legacy column is still read by the AI pipeline + kid tile.
      const taskType = opts.taskType ?? 'photo_verification';
      const verification_kind: 'photo' | 'checklist' =
        taskType === 'photo_verification' ? 'photo' : 'checklist';
      const { data, error: insertErr } = await supabase
        .from('chores')
        .insert({
          family_id: opts.familyId,
          kid_id: opts.kidId,
          title: opts.title.trim(),
          kind: opts.kind,
          is_optional: opts.isOptional ?? false,
          reward_weight: opts.rewardWeight ?? 1,
          recurrence_type: opts.recurrenceType ?? 'daily',
          recurrence_days: opts.recurrenceDays ?? [],
          task_type: taskType,
          verification_kind,
          coaching_tips: opts.coachingTips ?? [],
          reference_photo_path: opts.referencePhotoPath ?? null,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      await reload();
      return data?.id ?? null;
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
