/**
 * Age-appropriate ADHD developmental guidance for parents.
 *
 * Erica's feedback: "I see AI will let us know according to age; maybe we
 * can add some facts about an ADHD Brain at that age; what is
 * developmentally appropriate. Or we can put together a basic matrix of
 * social, emotional, cognitive skills per age."
 *
 * Per-age guidance is shown to the parent on the kid setup page (right
 * before they pick chores) and on the kid settings page (so they can
 * re-read it whenever they need a re-frame). The kid never sees this.
 *
 * IMPORTANT: This is therapist-informed framing, not a diagnostic tool.
 * The intent is to help parents calibrate expectations against typical
 * ADHD development at each age — not to replace clinical guidance. Erica
 * (LMFT) will review and refine these.
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
  /** Three dimensions of typical development for kids with ADHD this age. */
  dimensions: {
    social: string;
    emotional: string;
    cognitive: string;
  };
  /** A short paragraph translating the developmental frame into chore-picking
   *  decisions. The pragmatic "so what for tomorrow morning." */
  choreImplication: string;
};

export const AGE_GUIDANCE: AgeGuidance[] = [
  {
    minAge: 4,
    maxAge: 5,
    label: 'Ages 4–5',
    frame:
      'At this age, kids with ADHD are still building the executive scaffolding for almost everything. Expect lots of body, little time-awareness, and big feelings about small things.',
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
  },
  {
    minAge: 6,
    maxAge: 8,
    label: 'Ages 6–8',
    frame:
      'Early elementary kids with ADHD are starting to internalize routines but still need scaffolding to remember them. Initiating is harder than executing.',
    dimensions: {
      social:
        'Friendships matter more, but ADHD impulsivity can strain them. Kids this age often "act fine at school" then dysregulate at home — that\'s not a behavior problem, that\'s the cost of holding it together all day.',
      emotional:
        'Beginning to recognize their own feelings, but still need the language. Rejection sensitivity starts showing up. Connection-first repair lands much better than discipline-first.',
      cognitive:
        'Can hold 2–3 steps if structured well. Time is still abstract — "in 10 minutes" means nothing without a visual countdown. Following through after distraction is the hardest skill at this age.',
    },
    choreImplication:
      'A short list (3–5 chores) with the most important one anchored to a consistent time of day. The reference photo and coaching tips matter most at this age — kids can read short bullets but lose multi-paragraph instructions.',
  },
  {
    minAge: 9,
    maxAge: 12,
    label: 'Ages 9–12',
    frame:
      'Tweens with ADHD are managing more independent work but the gap between "what they can do" and "what they consistently do" widens. Hold the expectation, hold the relationship.',
    dimensions: {
      social:
        'Peer comparison is sharp. They notice they\'re different and may mask it. Time with their people matters more — chores that compete with social plans feel especially unfair.',
      emotional:
        'Self-esteem is fragile, especially around perceived failure at things peers find easy. Override messages like "You worked SO hard" lands at this age the way "Good job" doesn\'t.',
      cognitive:
        'Working memory expanding but still under-functioning compared to peers. Planning is emerging but inconsistent — they can plan in theory, struggle to plan in real life. External structure is still more powerful than internal motivation.',
    },
    choreImplication:
      'Mix one or two weekly chores in with daily ones — multi-step chores stretch planning skills. Reward weights help here: a real ownership chore (weekly bedroom clean) should count more than a daily quick win. Self-care chores still belong on the list.',
  },
  {
    minAge: 13,
    maxAge: 15,
    label: 'Ages 13–15',
    frame:
      'Early teens with ADHD are doing the slow work of separating "I am bad at this" from "this is harder for my brain." Your job shifts from manager to consultant.',
    dimensions: {
      social:
        'Identity formation is the work. Friend dynamics dominate emotional bandwidth. Public correction (or anything that feels like it) erodes the relationship faster than at any earlier age.',
      emotional:
        'Mood swings track sleep and screen time more than anything else. Shame around ADHD can show up as defiance — opt for connection-first overrides ("You worked hard") over correction-first ones.',
      cognitive:
        'Capable of complex multi-step tasks but follow-through is wildly inconsistent. Procrastination spirals begin. They can run laundry start-to-finish; they will also forget for three days.',
    },
    choreImplication:
      'Fewer, bigger chores that own a full domain (their laundry, their bathroom) work better than many small ones. Give them ownership of WHEN, not whether. The parent-override system shines here — use "Good enough for today" liberally.',
  },
  {
    minAge: 16,
    maxAge: 18,
    label: 'Ages 16–18',
    frame:
      'Older teens with ADHD are practicing adult life with you as a safety net. The goal isn\'t getting chores done — it\'s building the systems they\'ll use when you\'re not there.',
    dimensions: {
      social:
        'Driving, dating, jobs — life happens outside the house in real ways now. Chores that connect to actual adulthood (laundry, meals, car care) feel more legitimate than "tidy your room."',
      emotional:
        'Self-concept is forming around what kind of adult they\'ll be. ADHD-related struggles can feel existential ("Will I ever get my act together?"). Your steadiness is the model.',
      cognitive:
        'Executive function is closer to adult-typical but still maturing — full adult-level executive function in ADHD often arrives in the late 20s. Don\'t expect adult outcomes yet; do expect adult-level practice.',
    },
    choreImplication:
      'Set up chores that look like adult reps: a full bathroom clean, a real cooked meal, a weekly laundry routine. Reduce the daily list. The kid app at this age is mostly a shared accountability tool — they should be running most of it themselves.',
  },
];

export function guidanceForAge(age: number | null | undefined): AgeGuidance {
  if (typeof age !== 'number' || age < 0) {
    return AGE_GUIDANCE[1]; // sensible default (7–9)
  }
  return (
    AGE_GUIDANCE.find((g) => age >= g.minAge && age <= g.maxAge) ??
    AGE_GUIDANCE[AGE_GUIDANCE.length - 1]
  );
}
