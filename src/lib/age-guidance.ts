/**
 * Age-appropriate developmental guidance for parents.
 *
 * Per-age guidance is shown to the parent on the kid setup page (right
 * before they pick chores) and on the kid settings page (so they can
 * re-read it whenever they need a re-frame). The kid never sees this.
 *
 * Positioning (June 3, 2026):
 * Home Hero is a universal product. This guidance is written for every
 * kid at each age. When the parent has set a kid's `neurodivergence_context`
 * to `neurodivergent` (PRD §8A), the patterns described here tend to be
 * more pronounced and the recommended scaffolding sits at the higher end
 * of the range.
 *
 * This is parent-facing reframing content, NOT clinical or therapeutic
 * advice. It synthesizes published developmental guidance (CDC, AAP,
 * Montessori-aligned age guidelines) into the chore-picking decisions a
 * parent has to make tomorrow morning. Specific source citations live
 * with each chore suggestion in `chore-suggestions.ts`.
 *
 * Each bucket maps to the SAME min/max ages as AGE_BUCKETS in
 * chore-suggestions.ts so the guidance and the chore list always agree
 * on which bucket a kid falls into.
 */

export type AgeGuidance = {
  minAge: number;
  maxAge: number;
  label: string;
  /** One-sentence frame the parent reads first. */
  frame: string;
  /** Three dimensions of typical development at this age. */
  dimensions: {
    social: string;
    emotional: string;
    cognitive: string;
  };
  /** A short paragraph translating the developmental frame into chore-picking
   *  decisions. The pragmatic "so what for tomorrow morning." */
  choreImplication: string;
  /** Optional: how the patterns above tend to differ if neurodivergence
   *  context is set. Surfaced as a separate callout in the UI, only when
   *  the parent has selected `neurodivergent`. */
  neurodivergentLens?: string;
};

export const AGE_GUIDANCE: AgeGuidance[] = [
  {
    minAge: 4,
    maxAge: 5,
    label: 'Ages 4–5',
    frame:
      'At this age, kids are still building the executive scaffolding for almost everything. Expect lots of body, little time-awareness, and big feelings about small things.',
    dimensions: {
      social:
        'Plays alongside peers more than with them. Sharing is hard but learnable. Looks to you (not friends) for emotional regulation cues.',
      emotional:
        'Big feelings, fast onset, fast recovery — if the environment co-regulates. Tantrums are often regulation gaps, not defiance. Praise the effort, not the outcome.',
      cognitive:
        'Working memory is short — "go upstairs, brush your teeth, come back" is two transitions too many. They genuinely forget mid-step. Visual reminders beat verbal ones.',
    },
    choreImplication:
      'Pick 1–3 chores total. Each should be doable in under 5 minutes and feel like a single observable action ("Pillow on the pillow") not a multi-step routine. Self-care like brushing teeth is great here — make it routine, not negotiation.',
    neurodivergentLens:
      'Transitions are harder and last longer. The "two transitions too many" line above lands extra true. Lean on the reference photo and start with one chore, not three.',
  },
  {
    minAge: 6,
    maxAge: 8,
    label: 'Ages 6–8',
    frame:
      'Early elementary kids are starting to internalize routines but still need scaffolding to remember them. Initiating is harder than executing.',
    dimensions: {
      social:
        'Friendships matter more. Kids this age often "act fine at school" then dysregulate at home — that\'s not a behavior problem, that\'s the cost of holding it together all day.',
      emotional:
        'Beginning to recognize their own feelings, but still need the language. Rejection sensitivity starts showing up. Connection-first repair lands much better than discipline-first.',
      cognitive:
        'Can hold 2–3 steps if structured well. Time is still abstract — "in 10 minutes" means nothing without a visual countdown. Following through after distraction is the hardest skill at this age.',
    },
    choreImplication:
      'A short list (3–5 chores) with the most important one anchored to a consistent time of day. The reference photo and coaching tips matter most at this age — kids can read short bullets but lose multi-paragraph instructions.',
    neurodivergentLens:
      'Initiation is the bottleneck even more than at other ages — the kid often knows what to do and still can\'t start. Tip ratio matters: pictures and bullets over prose. After-school dysregulation may be intense; don\'t schedule the hard chore for then.',
  },
  {
    minAge: 9,
    maxAge: 12,
    label: 'Ages 9–12',
    frame:
      'Tweens are managing more independent work but the gap between "what they can do" and "what they consistently do" widens. Hold the expectation, hold the relationship.',
    dimensions: {
      social:
        'Peer comparison is sharp. They notice they\'re different and may mask it. Time with their people matters more — chores that compete with social plans feel especially unfair.',
      emotional:
        'Self-esteem is fragile, especially around perceived failure at things peers find easy. Override messages like "You worked SO hard" land at this age the way "Good job" doesn\'t.',
      cognitive:
        'Working memory is expanding but planning is still inconsistent — they can plan in theory and struggle to plan in real life. External structure is still more powerful than internal motivation.',
    },
    choreImplication:
      'Mix one or two weekly chores in with daily ones — multi-step chores stretch planning skills. Reward weights help here: a real ownership chore (weekly bedroom clean) should count more than a daily quick win. Self-care chores still belong on the list.',
    neurodivergentLens:
      'This is the age the "I am bad at this" stories cement. Catch the working memory and planning gaps with external structure (Home Hero IS that structure), not lectures. Override liberally with "You worked SO hard" — kids this age remember those.',
  },
  {
    minAge: 13,
    maxAge: 15,
    label: 'Ages 13–15',
    frame:
      'Early teens are separating who they\'re becoming from who their parent wanted them to be. Your job shifts from manager to consultant.',
    dimensions: {
      social:
        'Identity formation is the work. Friend dynamics dominate emotional bandwidth. Public correction (or anything that feels like it) erodes the relationship faster than at any earlier age.',
      emotional:
        'Mood swings track sleep and screen time more than anything else. Shame can show up as defiance — opt for connection-first overrides ("You worked hard") over correction-first ones.',
      cognitive:
        'Capable of complex multi-step tasks but follow-through is wildly inconsistent. Procrastination spirals begin. They can run laundry start-to-finish; they will also forget for three days.',
    },
    choreImplication:
      'Fewer, bigger chores that own a full domain (their laundry, their bathroom) work better than many small ones. Give them ownership of WHEN, not whether. The parent-override system shines here — use "Good enough for today" liberally.',
    neurodivergentLens:
      'The gap between "knows how" and "consistently does" can feel like willfulness; it almost always isn\'t. Procrastination spirals can be intense. Switch them to teen mode in settings so the kid surface drops the mascot and the "hero" framing.',
  },
  {
    minAge: 16,
    maxAge: 18,
    label: 'Ages 16–18',
    frame:
      'Older teens are practicing adult life with you as a safety net. The goal isn\'t getting chores done — it\'s building the systems they\'ll use when you\'re not there.',
    dimensions: {
      social:
        'Driving, dating, jobs — life happens outside the house in real ways now. Chores that connect to actual adulthood (laundry, meals, car care) feel more legitimate than "tidy your room."',
      emotional:
        'Self-concept is forming around what kind of adult they\'ll be. Struggles can feel existential ("Will I ever get my act together?"). Your steadiness is the model.',
      cognitive:
        'Executive function is closer to adult-typical but still maturing — published developmental research suggests full adult-level executive function often arrives in the mid-to-late twenties. Don\'t expect adult outcomes yet; do expect adult-level practice.',
    },
    choreImplication:
      'Set up chores that look like adult reps: a full bathroom clean, a real cooked meal, a weekly laundry routine. Reduce the daily list. The kid app at this age is mostly a shared accountability tool — they should be running most of it themselves.',
    neurodivergentLens:
      'Executive function maturation often runs later than peers. The "lateness" is a normal pace, not a verdict. Switch them to peer mode in settings so the kid surface reads as a real life-skills tracker, not a kids\' app.',
  },
];

export function guidanceForAge(age: number | null | undefined): AgeGuidance {
  if (typeof age !== 'number' || age < 0) {
    return AGE_GUIDANCE[1]; // sensible default (6–8)
  }
  return (
    AGE_GUIDANCE.find((g) => age >= g.minAge && age <= g.maxAge) ??
    AGE_GUIDANCE[AGE_GUIDANCE.length - 1]
  );
}
