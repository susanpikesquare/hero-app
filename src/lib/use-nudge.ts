/**
 * Parent nudge log — per Erica's June 3 ask (product-vision.md §4¾).
 *
 * Two surfaces:
 *   1. `recordNudge(kidId)` — fires when the parent taps the "Gentle
 *      nudge" button on a kid card. Writes one row to `parent_nudges`.
 *      In MVP this only logs; cross-device push to the kid's device is
 *      Beta (PRD §9.13). The log itself is the value: it powers the
 *      metacognition callout and the kid-initiated metric.
 *
 *   2. `useNudgeCount(kidId)` — returns the count of nudges this
 *      parent has sent to this kid in the current local day. Used by
 *      the dashboard to surface the "you've nudged 3+ times today —
 *      want to try a different approach?" coaching callout.
 *
 * Threshold for the metacognition callout: 3 nudges in a day.
 * Erica's verbatim ("AI says hey you nudged 3 times today — consider
 * an alternative") sets the bar at 3.
 */

import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';

export const NUDGE_METACOGNITION_THRESHOLD = 3;

/**
 * Compute the start-of-today timestamp in the device's local timezone,
 * as an ISO string (UTC) suitable for a Supabase query. Per
 * docs/engineering-defaults.md §1, day boundary is local midnight.
 */
function startOfTodayISO(): string {
  const now = new Date();
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  return localMidnight.toISOString();
}

export async function recordNudge(opts: {
  familyId: string;
  parentId: string;
  kidId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('parent_nudges').insert({
    family_id: opts.familyId,
    parent_id: opts.parentId,
    kid_id: opts.kidId,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Live count of nudges this parent has sent to this kid today.
 * Re-fetches whenever `bump` is called. Pass `bump` to the consumer so
 * it can refresh the count after sending a nudge.
 */
export function useNudgeCount(
  kidId: string | null | undefined
): { count: number; loading: boolean; bump: () => void } {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!kidId) {
      setCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const since = startOfTodayISO();
    supabase
      .from('parent_nudges')
      .select('id', { count: 'exact', head: true })
      .eq('kid_id', kidId)
      .gte('nudged_at', since)
      .then(({ count: c }) => {
        if (cancelled) return;
        setCount(c ?? 0);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kidId, tick]);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  return { count, loading, bump };
}
