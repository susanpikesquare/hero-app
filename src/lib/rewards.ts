/**
 * Reward logic for the kid-side game layer.
 *
 * Earnings + badges are computed from existing submissions — no extra
 * tables. A submission "counts" when AI says pass OR the parent overrides
 * with an approval (parent override lands in the next iteration; the
 * approved branch is here already so we don't have to refactor).
 *
 * The reward "currency" is the same number for every mode; only the
 * label, icon, and presentation change. Modes:
 *   - hops:   🐰  matches the kid-side bunny mascot. Default for new families.
 *   - stars:  ⭐  for parents who prefer a classic sticker-chart vibe.
 *   - badges: badges only, no running count. For older kids who'd find
 *             the counter childish.
 *   - off:    no reward UI at all. For families who don't want gamification.
 */

import type { Chore, Submission } from './use-chores';

export type RewardMode = 'hops' | 'stars' | 'badges' | 'off';

export type Badge = {
  slug: string;
  /** Inclusive threshold of earned count required to unlock. */
  threshold: number;
  label: string;
  emoji: string;
};

/**
 * Tuned for accessibility at different ages. The early thresholds are
 * close together so a 5-year-old feels frequent wins; the later ones
 * stretch out so older kids have a long-term goal.
 */
export const BADGES: Badge[] = [
  { threshold: 1, slug: 'first-hop', label: 'First Hop', emoji: '🌱' },
  { threshold: 5, slug: 'five-strong', label: 'Five Strong', emoji: '🌟' },
  { threshold: 10, slug: 'ten-up', label: 'Ten Up', emoji: '✨' },
  { threshold: 25, slug: 'twenty-five', label: '25 Club', emoji: '🏆' },
  { threshold: 50, slug: 'half-century', label: 'Half-Century', emoji: '🎖️' },
  { threshold: 100, slug: 'hundo', label: 'Hundo Hero', emoji: '👑' },
];

export type ModeDescriptor = {
  mode: RewardMode;
  /** Title used in settings + headers (e.g., "Hops"). */
  label: string;
  /** Singular noun for one earning (e.g., "hop"). */
  unitSingular: string;
  /** Plural noun (e.g., "hops"). */
  unitPlural: string;
  /** Emoji used as the visual unit. */
  emoji: string;
  /** Short one-liner shown in the picker. */
  blurb: string;
};

export const MODE_DESCRIPTORS: Record<RewardMode, ModeDescriptor> = {
  hops: {
    mode: 'hops',
    label: 'Hops',
    unitSingular: 'hop',
    unitPlural: 'hops',
    emoji: '🐰',
    blurb:
      'Bunny hops. On-brand, kid-friendly, great for ages 4–10. Counter + milestone badges.',
  },
  stars: {
    mode: 'stars',
    label: 'Stars',
    unitSingular: 'star',
    unitPlural: 'stars',
    emoji: '⭐',
    blurb:
      'Classic sticker-chart vibe. Same milestone badges, different icon.',
  },
  badges: {
    mode: 'badges',
    label: 'Badges only',
    unitSingular: 'badge',
    unitPlural: 'badges',
    emoji: '🏅',
    blurb:
      'No running counter; only milestone badges. Works well for older kids who find counts childish.',
  },
  off: {
    mode: 'off',
    label: 'No rewards',
    unitSingular: '',
    unitPlural: '',
    emoji: '',
    blurb:
      'Skip the game layer entirely. The chore loop still runs; nothing is celebrated visually.',
  },
};

export function descriptorFor(mode: string | null | undefined): ModeDescriptor {
  const m = (mode ?? 'hops') as RewardMode;
  return MODE_DESCRIPTORS[m] ?? MODE_DESCRIPTORS.hops;
}

/**
 * "Earned" is the sum of reward weights for all winning submissions a kid
 * has logged. A win is either an AI pass OR a parent override = approved.
 *
 * Each chore carries a `reward_weight` (default 1; optional "extra jobs"
 * tend to be 2-3). If `chores` is omitted (or the chore isn't found),
 * each win counts as 1.
 */
export function earnedCountFor(
  kidId: string,
  submissions: Submission[],
  chores?: Chore[]
): number {
  let total = 0;
  for (const s of submissions) {
    if (s.submitted_by !== kidId) continue;
    if (!(s.ai_verdict === 'pass' || s.parent_override === 'approved'))
      continue;
    const chore = chores?.find((c) => c.id === s.chore_id);
    total += chore?.reward_weight ?? 1;
  }
  return total;
}

export function badgesUnlocked(earned: number): Badge[] {
  return BADGES.filter((b) => earned >= b.threshold);
}

export function latestBadge(earned: number): Badge | null {
  const unlocked = badgesUnlocked(earned);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function nextBadge(earned: number): Badge | null {
  return BADGES.find((b) => earned < b.threshold) ?? null;
}

/**
 * Returns { current, target, percent } for the progress bar to the next badge.
 * If everything is unlocked, returns null.
 */
export function nextBadgeProgress(
  earned: number
): { current: number; target: number; percent: number } | null {
  const next = nextBadge(earned);
  if (!next) return null;
  const previousThreshold = latestBadge(earned)?.threshold ?? 0;
  const span = next.threshold - previousThreshold;
  const into = earned - previousThreshold;
  return {
    current: earned,
    target: next.threshold,
    percent: Math.max(0, Math.min(1, into / span)),
  };
}
