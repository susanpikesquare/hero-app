/**
 * Copy + presentation for parent override decisions.
 *
 * The three approval reasons come straight from Erica's review of the v1
 * spec ("Good enough for today" / "You worked hard" / "I'll help with the
 * rest"). They're encouragement-first by design — even a rejection ("Needs
 * another go") is framed as forward motion, never as failure.
 *
 * The kid-facing message strings get rendered on the kid mode chore tile
 * so the kid sees their grown-up's words the next time they open the app.
 */

import type { Database } from './database.types';

export type OverrideKind = Database['public']['Enums']['override_kind'];
export type OverrideReason = Database['public']['Enums']['override_reason'];

export type ApprovalReason = {
  value: OverrideReason;
  /** What the parent sees on the button. */
  parentLabel: string;
  /** What the kid sees as the result message. */
  kidMessage: string;
  /** Decorative emoji shown to the kid. */
  emoji: string;
};

export const APPROVAL_REASONS: ApprovalReason[] = [
  {
    value: 'good_enough_today',
    parentLabel: 'Good enough for today',
    kidMessage: 'Your grown-up said: Good enough for today.',
    emoji: '✨',
  },
  {
    value: 'worked_hard',
    parentLabel: 'You worked hard',
    kidMessage: 'Your grown-up said: You worked SO hard.',
    emoji: '💪',
  },
  {
    value: 'help_with_rest',
    parentLabel: "I'll help with the rest",
    kidMessage: "Your grown-up will help with the rest. We're a team.",
    emoji: '🤝',
  },
];

export const REJECTION = {
  value: 'rejected' as OverrideKind,
  parentLabel: 'Needs another go',
  kidMessage:
    'Your grown-up wants you to try once more. You’ve got this.',
  emoji: '🔁',
};

export function approvalReasonFor(
  reason: OverrideReason | null | undefined
): ApprovalReason | null {
  if (!reason) return null;
  return APPROVAL_REASONS.find((r) => r.value === reason) ?? null;
}

/**
 * Returns the kid-facing message string for a given override state. Returns
 * null if no override has been applied.
 */
export function overrideKidMessage(
  override: OverrideKind | null | undefined,
  reason: OverrideReason | null | undefined
): { message: string; emoji: string } | null {
  if (override === 'approved') {
    const r = approvalReasonFor(reason);
    if (r) return { message: r.kidMessage, emoji: r.emoji };
    // approved without a reason shouldn't happen (RPC enforces it), but
    // be defensive.
    return { message: 'Your grown-up approved it. Nice work!', emoji: '✓' };
  }
  if (override === 'rejected') {
    return { message: REJECTION.kidMessage, emoji: REJECTION.emoji };
  }
  return null;
}
