/**
 * Curated, age-appropriate chore suggestions surfaced during kid setup.
 *
 * These are **placeholders** — auto-drafted to get the flow working. Erica
 * (LMFT) will replace them with therapist-vetted lists once we're past v0,
 * and the rest of the app shouldn't have to change: just edit the array
 * below. Keep entries:
 *   - photo-friendly (the kid takes a picture to "submit" — so a tidy
 *     bedroom is great; "remembering to brush teeth" is not)
 *   - single-task, not multi-step ("Tidy bedroom floor" not "Get ready for
 *     bed including brushing teeth and putting on PJs")
 *   - encouragement-shaped — the title shouldn't read as nagging
 *
 * `kind` is mostly informational. The AI eval compares the submitted photo
 * to the parent's reference photo regardless of kind; the field is there
 * so future improvements (per-kind prompts, badges, streaks) have a hook.
 */

export type ChoreSuggestion = {
  title: string;
  /** One short sentence the parent sees while choosing. Not shown to the kid. */
  blurb: string;
  kind: string;
};

export type AgeBucket = {
  /** Inclusive lower bound (in years). */
  minAge: number;
  /** Inclusive upper bound (in years). */
  maxAge: number;
  label: string;
  /** A line the parent sees above the list, in encouragement-first tone. */
  framing: string;
  chores: ChoreSuggestion[];
};

export const AGE_BUCKETS: AgeBucket[] = [
  {
    minAge: 4,
    maxAge: 6,
    label: 'Ages 4–6',
    framing:
      'At this age, small wins build big confidence. Pick chores that feel doable in a few minutes.',
    chores: [
      {
        title: 'Make bed',
        blurb: 'Pillow on the pillow, blanket pulled up — close enough counts.',
        kind: 'bedroom',
      },
      {
        title: 'Toys in the bin',
        blurb: 'All visible toys back into their box or shelf.',
        kind: 'bedroom',
      },
      {
        title: 'Dirty clothes in the hamper',
        blurb: 'Floor is clear; everything dirty made it into the hamper.',
        kind: 'bedroom',
      },
      {
        title: 'Shoes on the shelf',
        blurb: 'Shoes paired up and put where they live.',
        kind: 'entry',
      },
      {
        title: 'Clear my plate',
        blurb: 'Plate, cup, and utensils make it from the table to the sink.',
        kind: 'kitchen',
      },
    ],
  },
  {
    minAge: 7,
    maxAge: 9,
    label: 'Ages 7–9',
    framing:
      'Early elementary kids can do real tasks start-to-finish. Aim for chores they can own without a parent watching.',
    chores: [
      {
        title: 'Make bed',
        blurb: 'Sheets flat, blanket up, pillow on top.',
        kind: 'bedroom',
      },
      {
        title: 'Tidy bedroom floor',
        blurb: "Floor is walkable — nothing on the carpet that doesn't belong.",
        kind: 'bedroom',
      },
      {
        title: 'Put away clean laundry',
        blurb: 'Folded clothes are in drawers or hung up, not in the basket.',
        kind: 'bedroom',
      },
      {
        title: 'Pack school backpack',
        blurb: 'Tomorrow’s books, folder, and water bottle are in the bag.',
        kind: 'entry',
      },
      {
        title: 'Wipe the table',
        blurb: 'Table is crumb-free and not sticky after meals.',
        kind: 'kitchen',
      },
      {
        title: 'Feed the pet',
        blurb: 'Bowls have the right amount of food and fresh water.',
        kind: 'pet',
      },
    ],
  },
  {
    minAge: 10,
    maxAge: 12,
    label: 'Ages 10–12',
    framing:
      'Tweens can handle multi-step chores. Pair a daily one with a weekly one.',
    chores: [
      {
        title: 'Make bed daily',
        blurb: 'Bed is made before they leave the room each morning.',
        kind: 'bedroom',
      },
      {
        title: 'Weekly bedroom clean',
        blurb: 'Floor clear, surfaces wiped, laundry handled.',
        kind: 'bedroom',
      },
      {
        title: 'Fold and put away laundry',
        blurb: 'Their own clothes are folded and in drawers.',
        kind: 'laundry',
      },
      {
        title: 'Pack lunch',
        blurb: 'Lunchbox is ready the night before with a balanced meal.',
        kind: 'kitchen',
      },
      {
        title: 'Empty the dishwasher',
        blurb: 'Clean dishes back in cabinets; dishwasher ready to load.',
        kind: 'kitchen',
      },
      {
        title: 'Take out the trash',
        blurb: 'Bin emptied, new bag in, bin returned to its spot.',
        kind: 'kitchen',
      },
      {
        title: 'Wipe the bathroom counter',
        blurb: 'Counter clear, toothpaste splatters gone, sink clean.',
        kind: 'bathroom',
      },
    ],
  },
  {
    minAge: 13,
    maxAge: 15,
    label: 'Ages 13–15',
    framing:
      'Early teens are practicing independence. Lean toward chores that own a full room or recurring task.',
    chores: [
      {
        title: 'Maintain bedroom (weekly)',
        blurb: 'A real clean — floor, surfaces, made bed, organized desk.',
        kind: 'bedroom',
      },
      {
        title: 'Wash own laundry',
        blurb: 'A load run start to finish: wash, dry, fold, put away.',
        kind: 'laundry',
      },
      {
        title: 'Clean the bathroom counter + sink',
        blurb: 'Surfaces sparkle; mirror is streak-free.',
        kind: 'bathroom',
      },
      {
        title: 'Vacuum a common area',
        blurb: 'Living-room or hallway floor is visibly vacuumed.',
        kind: 'living',
      },
      {
        title: 'Cook a simple meal',
        blurb: 'A meal they made shows on a plate — sandwich, eggs, pasta.',
        kind: 'kitchen',
      },
      {
        title: 'Take out trash + recycling',
        blurb: 'Both bins emptied and back in place; recycling sorted.',
        kind: 'kitchen',
      },
    ],
  },
  {
    minAge: 16,
    maxAge: 25,
    label: 'Ages 16+',
    framing:
      'Older teens are nearly running their own life. Chores here should look like adulting reps.',
    chores: [
      {
        title: 'Maintain bedroom (weekly)',
        blurb: 'Clean, organized, no laundry pile.',
        kind: 'bedroom',
      },
      {
        title: 'Run own laundry routine',
        blurb: 'Their clothes are clean and put away on a weekly cadence.',
        kind: 'laundry',
      },
      {
        title: 'Clean the bathroom (full)',
        blurb: 'Counter, sink, mirror, toilet all visibly clean.',
        kind: 'bathroom',
      },
      {
        title: 'Cook a full family meal',
        blurb: 'A plated meal they made for the household.',
        kind: 'kitchen',
      },
      {
        title: 'Vacuum + mop a room',
        blurb: 'Floor is visibly vacuumed and mopped, edges included.',
        kind: 'living',
      },
      {
        title: 'Wash the car',
        blurb: 'Exterior clean, no obvious dirt or streaks.',
        kind: 'outdoor',
      },
      {
        title: 'Mow the lawn',
        blurb: 'Lawn is evenly cut; edges trimmed.',
        kind: 'outdoor',
      },
    ],
  },
];

export function suggestChoresForAge(age: number | null | undefined): AgeBucket {
  if (typeof age !== 'number' || age < 0) {
    return AGE_BUCKETS[1]; // sensible default
  }
  return (
    AGE_BUCKETS.find((b) => age >= b.minAge && age <= b.maxAge) ??
    AGE_BUCKETS[AGE_BUCKETS.length - 1]
  );
}
