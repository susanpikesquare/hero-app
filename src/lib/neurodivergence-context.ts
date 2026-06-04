/**
 * Neurodivergence context — parent-provided, optional, parent-facing only.
 *
 * Per PRD v0.3.1 §8A and the June 3 working session: Home Hero is a
 * universal product. We don't diagnose, label, or categorize a kid.
 * We do let a parent optionally say "this kid is neurodivergent," because
 * that context legitimately changes:
 *   - The tasks we suggest (smaller, more concrete, lower daily ceiling)
 *   - How tasks are paced (higher support defaults)
 *   - The coaching surfaced (neurodivergence-aware content first)
 *
 * The hard rule: the context is PARENT-FACING ONLY. It never appears in
 * any kid session, kid screen, or kid-facing label. The kid sees the
 * same surface every other kid sees, tuned only by the (unlabeled)
 * support dimensions.
 *
 * MVP captures a single general context (`not_specified`, `neurotypical`,
 * `neurodivergent`). Specific profiles (ADHD, autism, anxiety,
 * sensory-sensitive) are Later, per the Workbook parking lot.
 *
 * Per-context support defaults (Workbook Q5.4 + Q5.5) are still OPEN
 * with Erica. When she lands her answers, the seeding logic goes in
 * `support-defaults.ts` (TBD). This module only defines the context
 * itself + the UI metadata.
 */

export type NeurodivergenceContext =
  | 'not_specified'
  | 'neurotypical'
  | 'neurodivergent';

/**
 * Display metadata for the parent-facing picker. Copy is intentionally
 * non-judgmental and frames the choice as context, not diagnosis:
 *   - No "Are they normal?" / "Are they typical?" wording
 *   - No clinical language
 *   - "Prefer not to say" is first-class, not buried
 *
 * Tomorrow's clinical session (Q5.4) may refine these strings. Treat
 * them as a draft pending Erica's review.
 */
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
      "Standard defaults. Use the support sliders to tune support up or down for any kid.",
  },
  {
    value: 'neurodivergent',
    label: 'Yes, or I suspect so',
    hint:
      "We'll start with stronger scaffolding — smaller steps, more reminders, more visual support — and surface coaching tuned for executive-function load. You can always adjust the support sliders.",
  },
];

/**
 * Returns the parent-facing label for a context, for displaying in
 * settings summaries and history. Never use this in any kid-facing
 * surface.
 */
export function contextLabel(context: NeurodivergenceContext): string {
  return CONTEXT_OPTIONS.find((o) => o.value === context)?.label ?? 'Unknown';
}

/**
 * Whether the context picker prompt has already been answered for this
 * kid. Used to decide whether to surface a gentle reminder in settings.
 */
export function isContextSet(context: NeurodivergenceContext): boolean {
  return context !== 'not_specified';
}
