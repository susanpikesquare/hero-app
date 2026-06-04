/**
 * Per-kid display mode resolution + voice constants.
 *
 * Home Hero is one app for the whole family. A parent with a 7-year-old
 * AND a 16-year-old needs both kids in the same dashboard, the same
 * settings, the same chore-creation flow. But the *kid surface* — what
 * each kid sees when they open the app — has to be developmentally
 * appropriate.
 *
 * Four modes (see migration 20260527120000_v0_kid_mode.sql):
 *   - `auto`  resolves from age at render time
 *   - `kid`   6-12 voice: bunny, "hero" framing, coached scaffolding
 *   - `teen`  13-15 voice: peer/coach tone, no mascot, flatter CTAs
 *   - `peer`  16-18 voice: matter-of-fact, household-OS framing
 *
 * The parent picks the mode per kid in Settings. `auto` is the default
 * and works for most families. Use a literal mode when the kid is
 * developmentally ahead or behind their birthday — Erica's framework
 * explicitly rejects birthday-determinism.
 *
 * Adding new copy here: ALWAYS provide all three resolved-mode entries
 * (kid / teen / peer). Don't let a string be empty — pick something
 * that fits the voice, even if it's a softer version of the kid one.
 */

export type KidModeSetting = 'auto' | 'kid' | 'teen' | 'peer';
export type ResolvedKidMode = 'kid' | 'teen' | 'peer';

/**
 * Resolves the actual mode to render given the parent's setting + age.
 * The boundary ages are pulled from Erica's developmental matrix
 * (4-5, 6-8, 9-12, 13-15, 16-18). 13 is the kid→teen line; 16 is the
 * teen→peer line.
 */
export function resolveKidMode(opts: {
  setting: KidModeSetting | null | undefined;
  age: number | null | undefined;
}): ResolvedKidMode {
  const setting = opts.setting ?? 'auto';
  if (setting !== 'auto') return setting;
  const age = opts.age ?? 0;
  if (age >= 16) return 'peer';
  if (age >= 13) return 'teen';
  return 'kid';
}

/**
 * Voice strings per resolved mode. Edit with Erica — these come from
 * the framework. The 6-12 voice is the existing app voice; teen + peer
 * are net-new and need her sign-off for v1.
 */
export const VOICE: Record<ResolvedKidMode, KidVoice> = {
  kid: {
    greetingEyebrow: (name) => `Hi ${name} 👋`,
    todayTitle: 'Today’s to-dos',
    allDoneTitle: "You're all done for today!",
    remainingHint: (done, total) =>
      `${done} of ${total} done. Tap any chore to send a photo when you're ready.`,
    submitCta: 'Take a photo →',
    markDoneCta: 'Mark done →',
    retryCta: 'Try again →',
    waitingCallout: 'Waiting on your grown-up',
    overrideRetryLabel: 'Your grown-up wants you to try once more. You’ve got this.',
    rewardLabelHops: 'hops today',
    showMascot: true,
  },
  teen: {
    greetingEyebrow: (name) => `Hey ${name}`,
    todayTitle: 'Today',
    allDoneTitle: 'Cleared for the day.',
    remainingHint: (done, total) =>
      `${done} of ${total} done. Open any one to upload when you’re ready.`,
    submitCta: 'Upload photo',
    markDoneCta: 'Mark done',
    retryCta: 'Run it back',
    waitingCallout: 'Sent for review',
    overrideRetryLabel: 'Parent asked for another pass. Check the reference and resend.',
    rewardLabelHops: 'streak today',
    showMascot: false,
  },
  peer: {
    greetingEyebrow: (name) => `${name}`,
    todayTitle: 'Today',
    allDoneTitle: 'Done.',
    remainingHint: (done, total) => `${done}/${total} complete.`,
    submitCta: 'Submit photo',
    markDoneCta: 'Mark complete',
    retryCta: 'Resubmit',
    waitingCallout: 'Pending review',
    overrideRetryLabel: 'Parent requested another submission. See reference.',
    rewardLabelHops: 'tracked today',
    showMascot: false,
  },
};

export type KidVoice = {
  greetingEyebrow: (name: string) => string;
  todayTitle: string;
  allDoneTitle: string;
  remainingHint: (done: number, total: number) => string;
  submitCta: string;
  markDoneCta: string;
  retryCta: string;
  waitingCallout: string;
  overrideRetryLabel: string;
  rewardLabelHops: string;
  /** Whether to show the bunny mascot + soft illustration treatment. */
  showMascot: boolean;
};

/**
 * Reader-friendly label for the mode picker UI. Used in kid settings.
 */
export const MODE_LABELS: Record<KidModeSetting, { label: string; hint: string }> = {
  auto: {
    label: 'Auto (by age)',
    hint:
      "Picks the right voice based on this kid's age. 6–12 sees the hero voice, 13–15 the teen voice, 16+ the peer voice.",
  },
  kid: {
    label: 'Kid (6–12)',
    hint:
      'Bunny mascot, "hero" framing, three scaffolding tips per chore. Best for kids who want the warmer surface.',
  },
  teen: {
    label: 'Teen (13–15)',
    hint:
      'No mascot. Peer/coach voice. Flatter CTAs. Best for kids who want to feel less coached.',
  },
  peer: {
    label: 'Peer (16–18)',
    hint:
      "Matter-of-fact. Closest to an adult productivity tool. Best for older teens preparing to launch.",
  },
};
