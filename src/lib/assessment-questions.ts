/**
 * Pre-signup self-assessment — the "is this for you" mirror.
 *
 * Per the June 3 working session, Erica wants a short assessment BEFORE
 * the parent signs up. Two purposes:
 *   1. Qualify the audience — if none of this lands, the product is
 *      probably not for them (and that's fine to know up front).
 *   2. Reframe the parent's arrival — from "consumer signing up for a
 *      thing" to "person seeing themselves named honestly."
 *
 * NOT a gate. The parent can proceed regardless of their answers. We
 * record their answers (analytics + a `last_assessment_at` on the family
 * once they create one, future work) so we can later correlate
 * activation with their self-reported starting state.
 *
 * Page 1 — "Am I experiencing these?": the felt-experience items from
 * §0 of product-vision.md, written in first person.
 *
 * Page 2 — "Do I want these?": the keywords (harmony, peace, joy) and
 * the specific outcomes from the north-star list, written as
 * aspirations.
 *
 * Likert scale: yes / sometimes / no. Three options, not five — Erica's
 * "less is more" rule applied to the assessment itself.
 */

export type AssessmentAnswer = 'yes' | 'sometimes' | 'no';

export type AssessmentQuestion = {
  id: string;
  text: string;
};

export type AssessmentPage = {
  id: 'experiencing' | 'wanting';
  eyebrow: string;
  title: string;
  lead: string;
  questions: AssessmentQuestion[];
};

export const ASSESSMENT_PAGES: AssessmentPage[] = [
  {
    id: 'experiencing',
    eyebrow: 'Step 1 of 2',
    title: 'Are you experiencing any of this?',
    lead:
      "Three quick questions. There are no wrong answers. We're not scoring you — we just want to know what we're working with so the app can meet you where you are.",
    questions: [
      {
        id: 'exp_overwhelm',
        text:
          'Most days, I am quietly running the whole household: the reminders, the standard-keeping, the follow-up.',
      },
      {
        id: 'exp_distance',
        text:
          'I often feel exhausted, short on patience, and a little distanced from the people I love most.',
      },
      {
        id: 'exp_conflict',
        text:
          'The simplest daily things — getting kids to do their part of the house — end in conflict more often than I would like.',
      },
    ],
  },
  {
    id: 'wanting',
    eyebrow: 'Step 2 of 2',
    title: 'Do you want any of this?',
    lead:
      "Same three options. We're checking what you're moving toward, not just what you're moving away from.",
    questions: [
      {
        id: 'want_harmony',
        text: 'More harmony, peace, and joy in my home — less daily friction.',
      },
      {
        id: 'want_competence',
        text:
          'My kids experiencing themselves as capable and contributing, not just compliant.',
      },
      {
        id: 'want_presence',
        text:
          "Time back to actually be a family — not just run one. Less reaction-management mode, more let-me-just-be-with-you mode.",
      },
    ],
  },
];

export type AssessmentResult = Record<string, AssessmentAnswer>;

/**
 * A simple heuristic for whether the assessment "lit up." Counts answers
 * across both pages: 'yes' = 2, 'sometimes' = 1, 'no' = 0. Max possible
 * is 12 (six questions × 2). Anything above ~6 is a strong match;
 * anything below ~3 is probably the wrong product for them.
 *
 * We expose this only so we can record it; the assessment is NOT a gate
 * and the parent always sees the same encouraging next step regardless.
 */
export function scoreAssessment(result: AssessmentResult): number {
  return Object.values(result).reduce((sum, answer) => {
    if (answer === 'yes') return sum + 2;
    if (answer === 'sometimes') return sum + 1;
    return sum;
  }, 0);
}
