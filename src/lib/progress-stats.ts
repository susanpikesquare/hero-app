/**
 * Stats helpers for the per-kid progress page.
 *
 * Everything is computed client-side from the submissions array we already
 * load on the dashboard. No new schema, no new RPCs — same single source
 * of truth as the rewards counter.
 */

import type { Submission } from './use-chores';

/** Local-date key like "2026-05-24" — survives timezone weirdness. */
export function localDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWin(s: Submission): boolean {
  return s.ai_verdict === 'pass' || s.parent_override === 'approved';
}

/**
 * Returns a list of N consecutive days (oldest → newest), each with
 * the count of wins and total submissions on that day.
 */
export type DayBucket = {
  date: Date;
  key: string;
  wins: number;
  total: number;
};

export function dailyBuckets(
  submissions: Submission[],
  kidId: string,
  days: number
): DayBucket[] {
  const map = new Map<string, DayBucket>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = localDateKey(d);
    map.set(key, { date: d, key, wins: 0, total: 0 });
  }

  for (const s of submissions) {
    if (s.submitted_by !== kidId) continue;
    const key = localDateKey(new Date(s.submitted_at));
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (isWin(s)) bucket.wins += 1;
  }

  return Array.from(map.values());
}

/** Group day buckets into weeks (Sun-anchored), oldest first. */
export function weeklyBuckets(buckets: DayBucket[]): DayBucket[][] {
  const weeks: DayBucket[][] = [];
  let current: DayBucket[] = [];
  for (const b of buckets) {
    if (b.date.getDay() === 0 && current.length > 0) {
      weeks.push(current);
      current = [];
    }
    current.push(b);
  }
  if (current.length > 0) weeks.push(current);
  return weeks;
}

/**
 * Longest run of consecutive days that had at least one win, looking
 * over the last `days` days only.
 */
export function longestStreak(buckets: DayBucket[]): number {
  let best = 0;
  let run = 0;
  for (const b of buckets) {
    if (b.wins > 0) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/** Current run that includes today (or yesterday if today has no wins yet). */
export function currentStreak(buckets: DayBucket[]): number {
  let run = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].wins > 0) run += 1;
    else if (i === buckets.length - 1) continue; // today might still come
    else break;
  }
  return run;
}

/** Win rate over the window. Returns 0 when there are no submissions. */
export function winRate(buckets: DayBucket[]): number {
  let wins = 0;
  let total = 0;
  for (const b of buckets) {
    wins += b.wins;
    total += b.total;
  }
  if (total === 0) return 0;
  return wins / total;
}

/** Submissions per chore in this window. */
export function perChoreBreakdown(
  submissions: Submission[],
  kidId: string,
  days: number
): Map<string, { total: number; wins: number }> {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const map = new Map<string, { total: number; wins: number }>();
  for (const s of submissions) {
    if (s.submitted_by !== kidId) continue;
    const submittedAt = new Date(s.submitted_at);
    if (submittedAt < cutoff) continue;
    const existing = map.get(s.chore_id) ?? { total: 0, wins: 0 };
    existing.total += 1;
    if (isWin(s)) existing.wins += 1;
    map.set(s.chore_id, existing);
  }
  return map;
}
