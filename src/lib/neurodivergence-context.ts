/**
 * Support profiles — parent-provided, optional, parent-facing only.
 *
 * Susan's QA feedback: the original "neurodivergent / neurotypical /
 * not specified" picker felt clinical, intimidating, and made parents
 * feel like they were labeling their kid. New design: a multi-select
 * with friendlier prompt ("Do any of these apply?"), specific options,
 * and a "not sure" path.
 *
 * The schema (family_members.support_profiles text[]) stores an array
 * of selected values. Empty array = no profile applies (the new
 * default — what we used to call "neurotypical"). Multi-select means a
 * kid with ADHD + anxiety can have both selected and get both content
 * lenses surfaced.
 *
 * What each profile changes (when wired up):
 *   - Age guidance card: shows a profile-specific lens paragraph in
 *     addition to the universal developmental signal.
 *   - Chore suggestions: starting ceiling skews lower; coaching tips
 *     skew toward step-chunking + visual support.
 *   - Articles + coaching library: surfaces profile-aware content
 *     when available.
 *
 * The parent's PARENT-FACING surface uses these; the kid's surface
 * never sees them as labels (PRD §8A — the no-leak rule still holds).
 *
 * Each profile maps to a body of published guidance from a named
 * authority — see `PROFILE_OPTIONS[i].sources`. Per Workbook Q3.1,
 * we cite the source so claims aren't asserted on Home Hero's own
 * authority.
 */

export type SupportProfile =
  | 'adhd'
  | 'autism'
  | 'anxiety'
  | 'sensory'
  | 'not_sure';

export type ProfileOption = {
  value: SupportProfile;
  label: string;
  hint: string;
  sources: string[];
};

/**
 * The picker options shown to a parent. Order: most common → least
 * common → "not sure." Copy is intentionally non-clinical.
 */
export const PROFILE_OPTIONS: ProfileOption[] = [
  {
    value: 'adhd',
    label: 'ADHD or attention challenges',
    hint:
      "Has trouble with task initiation, finishing what they start, or remembering multi-step routines. Diagnosed or just suspected — either counts.",
    sources: [
      'CHADD (Children and Adults with ADHD)',
      'Child Mind Institute — ADHD content',
      'Understood.org — ADHD & executive function',
    ],
  },
  {
    value: 'autism',
    label: 'On the autism spectrum',
    hint:
      'Sensory differences, strong preference for routine, specific interests, or social communication patterns. Diagnosed or just suspected.',
    sources: [
      'Autism Society',
      'Child Mind Institute — Autism content',
      'AAP HealthyChildren.org — Autism spectrum',
    ],
  },
  {
    value: 'anxiety',
    label: 'Anxiety or big worries',
    hint:
      'Worry that interferes with daily life, avoidance of new situations, or strong reactions to small triggers.',
    sources: [
      'Anxiety & Depression Association of America (ADAA)',
      'Child Mind Institute — Anxiety content',
    ],
  },
  {
    value: 'sensory',
    label: 'Sensory sensitivity',
    hint:
      "Strong reactions to sounds, textures, lights, smells, or food. Can co-occur with autism, ADHD, or stand on its own.",
    sources: [
      'STAR Institute for Sensory Processing',
      'Child Mind Institute — Sensory processing',
    ],
  },
  {
    value: 'not_sure',
    label: 'Not sure / would like more support either way',
    hint:
      "We'll start with stronger scaffolding (smaller steps, more reminders, more visual support) and you can dial it back anytime.",
    sources: [],
  },
];

/**
 * Per-profile chore-picking tuning. ONE short, non-clinical sentence per
 * profile describing how to shape the chore load — surfaced on the
 * age-guidance card so the parent sees the framework respond differently
 * to ADHD vs anxiety vs autism vs sensory (Susan QA, 2026-06-08).
 *
 * These are scaffolding guidance, NOT clinical advice — they describe
 * how to structure tasks, drawn from the published sources cited on each
 * PROFILE_OPTIONS entry. Erica's content pass will deepen these into
 * per-age-band paragraphs; this is the first, honest, differentiated cut.
 */
export const PROFILE_CHORE_TUNING: Record<SupportProfile, string> = {
  adhd:
    'Task initiation is the hard part, not effort. Favor single-step chores with a clear visual finish line, lean on the reference photo, and keep the daily list short so starting never feels like a mountain.',
  autism:
    'Predictability is the win. Keep the same chores in the same order each day, make “done” concrete and unambiguous, and warn before any change to the routine rather than springing it.',
  anxiety:
    'Certainty lowers the stakes. Pick chores with an obvious, achievable “done,” avoid open-ended or perfection-shaped tasks, and let early wins build before adding anything new.',
  sensory:
    'Watch the sensory load of the task itself — textures, smells, noise, wet hands. Offer swaps (gloves, a quieter time of day) and don’t make a chore a sensory battle.',
  not_sure:
    'Start with stronger scaffolding — fewer chores, smaller steps, more visual support — and dial it back as you see what lands. You can change this anytime.',
};

/**
 * Whether the parent has indicated anything at all. Used by the
 * support-card UI to decide whether to surface the profile-aware lenses.
 */
export function hasAnyProfile(profiles: string[] | null | undefined): boolean {
  if (!profiles) return false;
  return profiles.length > 0;
}

/**
 * Returns the parent-friendly display labels for a parent's selection.
 * Used in settings to summarize ("Selected: ADHD, anxiety").
 */
export function profileLabels(profiles: string[]): string[] {
  const byValue = new Map<string, string>();
  for (const opt of PROFILE_OPTIONS) {
    byValue.set(opt.value, opt.label);
  }
  return profiles.map((p) => byValue.get(p) ?? p);
}

/* ── BACK-COMPAT LAYER ──────────────────────────────────────────────────
 *
 * The earlier picker used neurodivergence_context: 'not_specified' |
 * 'neurotypical' | 'neurodivergent'. The schema still has that column
 * and the migration backfilled support_profiles from it. Keeping these
 * types exported so code that hasn't migrated still compiles.
 */

export type NeurodivergenceContext =
  | 'not_specified'
  | 'neurotypical'
  | 'neurodivergent';

export const CONTEXT_OPTIONS: {
  value: NeurodivergenceContext;
  label: string;
  hint: string;
}[] = [
  {
    value: 'not_specified',
    label: 'Prefer not to say',
    hint:
      "We'll use age-typical defaults. You can always change this later.",
  },
  {
    value: 'neurotypical',
    label: 'No, not that I know of',
    hint:
      'Standard defaults. Use the support sliders to tune support up or down for any kid.',
  },
  {
    value: 'neurodivergent',
    label: 'Yes, or I suspect so',
    hint:
      "We'll start with stronger scaffolding and surface coaching tuned for executive-function load. You can always adjust.",
  },
];

export function contextLabel(context: NeurodivergenceContext): string {
  return CONTEXT_OPTIONS.find((o) => o.value === context)?.label ?? 'Unknown';
}

export function isContextSet(context: NeurodivergenceContext): boolean {
  return context !== 'not_specified';
}
