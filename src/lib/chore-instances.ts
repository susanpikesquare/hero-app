/**
 * ChoreInstance helpers (PRD §12).
 *
 * A `chore_instance` is one occurrence of a `chore` (the durable
 * definition) on a specific date. This file owns:
 *   1. `ensureToday(familyId)` — fires the lazy-generation RPC so the
 *      family has chore_instances rows for `today` covering every
 *      active recurring chore whose pattern says it's due today.
 *      Idempotent on the server.
 *   2. `useTodayInstances(familyId, enabled)` — a hook that returns
 *      today's instances + a reload function. Used by the dashboard
 *      and the kid Today view to render and count.
 *
 * Day boundary: the device's local timezone, per
 * docs/engineering-defaults.md §1.
 *
 * Scope note: this file does NOT yet replace the existing
 * choreStatusToday derived-from-submissions path. It runs alongside it.
 * Next iteration of Batch C wires the dashboard's Today / Overdue
 * counters to read from instances directly.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Database } from './database.types';
import { supabase } from './supabase';

export type ChoreInstance =
  Database['public']['Tables']['chore_instances']['Row'];

/**
 * The device's "today" as an ISO date string (YYYY-MM-DD) in local
 * timezone. Per engineering-defaults §1 we use the household timezone,
 * which for a single-device household is the device's tz.
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Lazy-generate today's chore instances on the server. Safe to call
 * repeatedly — the unique (chore_id, due_date) index handles dedup.
 */
export async function ensureToday(familyId: string): Promise<void> {
  const { error } = await supabase.rpc('ensure_chore_instances_for_date', {
    p_family_id: familyId,
    p_due_date: todayISO(),
  });
  if (error) {
    // Best-effort: don't block the UI on instance generation. The
    // dashboard will still render submissions-based status. We log so
    // a real failure isn't invisible.
    // eslint-disable-next-line no-console
    console.warn('[chore-instances] ensureToday failed:', error.message);
  }
}

/**
 * Returns today's chore_instances for the family. Calls ensureToday()
 * once on mount so missing rows get backfilled before the read.
 */
export function useTodayInstances(
  familyId: string | null | undefined,
  enabled: boolean
): {
  instances: ChoreInstance[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [instances, setInstances] = useState<ChoreInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);

  const reload = useCallback(async () => {
    if (!familyId || !enabled) {
      setInstances([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await ensureToday(familyId);
    const { data, error } = await supabase
      .from('chore_instances')
      .select('*')
      .eq('family_id', familyId)
      .eq('due_date', todayISO());
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[chore-instances] load failed:', error.message);
      setInstances([]);
    } else {
      setInstances(data ?? []);
    }
    setLoading(false);
  }, [familyId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { instances, loading, reload };
}

/**
 * Given a list of instances and a kid, return the count of "needs to
 * happen today" instances — `open` plus any retry/failure states.
 * Used by the parent dashboard's Today zone (PRD §10A).
 */
export function openCountForKid(
  instances: ChoreInstance[],
  kidId: string
): number {
  return instances.filter(
    (i) => i.kid_id === kidId && (i.status === 'open' || i.status === 'submitted')
  ).length;
}

/**
 * Given a list of instances and a kid, return the count of "done"
 * instances today (passed or complete).
 */
export function doneCountForKid(
  instances: ChoreInstance[],
  kidId: string
): number {
  return instances.filter(
    (i) =>
      i.kid_id === kidId && (i.status === 'passed' || i.status === 'complete')
  ).length;
}
