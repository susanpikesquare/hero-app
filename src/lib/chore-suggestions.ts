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
 * Per-chore `tips` are short ADHD-friendly bullets shown on the kid's
 * chore tile so they don't have to remember what "done" means. Capped
 * at 3 per chore in the UI. Tips are seeded into chores.coaching_tips
 * when the parent adds a chore from this library.
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
  /** 1-3 short ADHD-friendly bullets shown to the kid on the chore tile. */
  tips: string[];
  /**
   * How the kid submits proof. Default 'photo' (current behavior).
   * 'checklist' = no photo, kid just taps "Mark done" — used for self-care
   * chores like brushing teeth where photographing the kid is not OK.
   */
  verification: 'photo' | 'checklist';
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
    maxAge: 5,
    label: 'Ages 4–5',
    framing:
      'At this age, small wins build big confidence. Pick chores that feel doable in a few minutes.',
    chores: [
      // Self-care first. These are 'checklist' chores — no photo, kid just
      // taps "Mark done" because photographing kids in self-care moments
      // would be wrong. Erica's note: "we would not take pics of the kids
      // at all; reminders are good."
      {
        title: 'Brush teeth (morning)',
        blurb: 'Two minutes, top and bottom. No photo needed.',
        kind: 'self-care',
        tips: [
          'Two whole minutes',
          'Top teeth AND bottom teeth',
          'Don’t forget the back ones',
        ],
        verification: 'checklist',
      },
      {
        title: 'Brush teeth (night)',
        blurb: 'Right after your last snack of the day.',
        kind: 'self-care',
        tips: [
          'After your last snack',
          'Two whole minutes',
          'Spit, don’t swallow',
        ],
        verification: 'checklist',
      },
      {
        title: 'Wash hands before meals',
        blurb: 'Soap, warm water, ABCs.',
        kind: 'self-care',
        tips: [
          'Soap AND warm water',
          'Sing the ABCs while scrubbing',
          'Dry with a towel, not your shirt',
        ],
        verification: 'checklist',
      },
      {
        title: 'Make bed',
        blurb: 'Pillow on the pillow, blanket pulled up — close enough counts.',
        kind: 'bedroom',
        tips: [
          'Pillow on the pillow',
          'Blanket pulled all the way up',
          'Pat it smooth with your hand',
        ],
        verification: 'photo',
      },
      {
        title: 'Toys in the bin',
        blurb: 'All visible toys back into their box or shelf.',
        kind: 'bedroom',
        tips: [
          'Pick a bin first',
          'Toys on the floor go in',
          'Close the lid when you’re done',
        ],
        verification: 'photo',
      },
      {
        title: 'Dirty clothes in the hamper',
        blurb: 'Floor is clear; everything dirty made it into the hamper.',
        kind: 'bedroom',
        tips: [
          'Sniff test, then in',
          'Socks count too',
          'Peek under the bed',
        ],
        verification: 'photo',
      },
      {
        title: 'Shoes on the shelf',
        blurb: 'Shoes paired up and put where they live.',
        kind: 'entry',
        tips: [
          'Pairs go together',
          'Heels face out',
          'Hang up your coat too',
        ],
        verification: 'photo',
      },
      {
        title: 'Clear my plate',
        blurb: 'Plate, cup, and utensils make it from the table to the sink.',
        kind: 'kitchen',
        tips: [
          'Plate to the sink',
          'Cup and fork too',
          'Push your chair back in',
        ],
        verification: 'photo',
      },
    ],
  },
  {
    minAge: 6,
    maxAge: 8,
    label: 'Ages 6–8',
    framing:
      'Early elementary kids can do real tasks start-to-finish. Aim for chores they can own without a parent watching.',
    chores: [
      // Self-care (no photo, tap-to-confirm).
      {
        title: 'Brush teeth (morning)',
        blurb: 'Two minutes, top and bottom. No photo needed.',
        kind: 'self-care',
        tips: [
          'Two whole minutes',
          'Top, bottom, and the back ones',
          'Floss if it’s a flossing day',
        ],
        verification: 'checklist',
      },
      {
        title: 'Brush teeth (night)',
        blurb: 'After your last snack — no exceptions.',
        kind: 'self-care',
        tips: [
          'After your last snack',
          'Two whole minutes',
          'Spit, don’t swallow',
        ],
        verification: 'checklist',
      },
      {
        title: 'Shower or bath',
        blurb: 'Hair, body, dry off — actually getting wet.',
        kind: 'self-care',
        tips: [
          'Hair: shampoo, rinse',
          'Body: soap top to bottom',
          'Towel dry, don’t drip on the floor',
        ],
        verification: 'checklist',
      },
      {
        title: 'Make bed',
        blurb: 'Sheets flat, blanket up, pillow on top.',
        kind: 'bedroom',
        tips: [
          'Sheet flat first',
          'Blanket pulled up',
          'Pillow on top, smooth',
        ],
        verification: 'photo',
      },
      {
        title: 'Tidy bedroom floor',
        blurb: "Floor is walkable — nothing on the carpet that doesn't belong.",
        kind: 'bedroom',
        tips: [
          'Pick a corner to start',
          'Everything has a home',
          'You should see all the carpet',
        ],
        verification: 'photo',
      },
      {
        title: 'Put away clean laundry',
        blurb: 'Folded clothes are in drawers or hung up, not in the basket.',
        kind: 'bedroom',
        tips: [
          'One item at a time',
          'Drawers, not floor',
          'Hang up anything that wrinkles',
        ],
        verification: 'photo',
      },
      {
        title: 'Pack school backpack',
        blurb: 'Tomorrow’s books, folder, and water bottle are in the bag.',
        kind: 'entry',
        tips: [
          'Lunchbox in',
          'Tomorrow’s books and folder in',
          'Water bottle topped up',
        ],
        verification: 'photo',
      },
      {
        title: 'Wipe the table',
        blurb: 'Table is crumb-free and not sticky after meals.',
        kind: 'kitchen',
        tips: [
          'Crumbs into your hand first',
          'Damp cloth, no streaks',
          'Lift placemats and check under',
        ],
        verification: 'photo',
      },
      {
        title: 'Feed the pet',
        blurb: 'Bowls have the right amount of food and fresh water.',
        kind: 'pet',
        tips: [
          'Use the measuring scoop',
          'Fresh water on top',
          'Wipe up any spills',
        ],
        verification: 'photo',
      },
    ],
  },
  {
    minAge: 9,
    maxAge: 12,
    label: 'Ages 9–12',
    framing:
      'Tweens can handle multi-step chores. Pair a daily one with a weekly one.',
    chores: [
      // Self-care (no photo).
      {
        title: 'Brush teeth (morning)',
        blurb: 'Two minutes, top and bottom. No photo needed.',
        kind: 'self-care',
        tips: [
          'Two minutes — really',
          'Top, bottom, and the back ones',
          'Floss if it’s a flossing day',
        ],
        verification: 'checklist',
      },
      {
        title: 'Brush teeth (night)',
        blurb: 'Last thing before bed.',
        kind: 'self-care',
        tips: [
          'After your last snack',
          'Two whole minutes',
          'Spit, don’t swallow',
        ],
        verification: 'checklist',
      },
      {
        title: 'Shower',
        blurb: 'Actually wet, actually clean.',
        kind: 'self-care',
        tips: [
          'Hair: shampoo + condition',
          'Body: soap top to bottom',
          'Towel dry, hang the towel up',
        ],
        verification: 'checklist',
      },
      {
        title: 'Deodorant',
        blurb: 'A new habit at this age.',
        kind: 'self-care',
        tips: [
          'After your shower works best',
          'Both armpits — yes, both',
          'Cap back on, lid closed',
        ],
        verification: 'checklist',
      },
      {
        title: 'Make bed daily',
        blurb: 'Bed is made before they leave the room each morning.',
        kind: 'bedroom',
        tips: [
          'Pull the sheet up first',
          'Blanket smooth, no wrinkles',
          'Pillows on top',
        ],
        verification: 'photo',
      },
      {
        title: 'Weekly bedroom clean',
        blurb: 'Floor clear, surfaces wiped, laundry handled.',
        kind: 'bedroom',
        tips: [
          'Floor clear first',
          'Wipe dust off the desk and shelves',
          'Vacuum or sweep last',
        ],
        verification: 'photo',
      },
      {
        title: 'Fold and put away laundry',
        blurb: 'Their own clothes are folded and in drawers.',
        kind: 'laundry',
        tips: [
          'Match socks first',
          'Fold shirts in thirds',
          'Drawer, not chair',
        ],
        verification: 'photo',
      },
      {
        title: 'Pack lunch',
        blurb: 'Lunchbox is ready the night before with a balanced meal.',
        kind: 'kitchen',
        tips: [
          'Protein, fruit, snack, drink',
          'Cold stuff in the fridge until morning',
          'Lunchbox by the door when packed',
        ],
        verification: 'photo',
      },
      {
        title: 'Empty the dishwasher',
        blurb: 'Clean dishes back in cabinets; dishwasher ready to load.',
        kind: 'kitchen',
        tips: [
          'Hand sharp things to a grown-up',
          'Plates and bowls back in cabinets',
          'Run again if there are dirty dishes waiting',
        ],
        verification: 'photo',
      },
      {
        title: 'Take out the trash',
        blurb: 'Bin emptied, new bag in, bin returned to its spot.',
        kind: 'kitchen',
        tips: [
          'Tie the bag before lifting',
          'Fresh bag in the can',
          'Bin back outside in its spot',
        ],
        verification: 'photo',
      },
      {
        title: 'Wipe the bathroom counter',
        blurb: 'Counter clear, toothpaste splatters gone, sink clean.',
        kind: 'bathroom',
        tips: [
          'Move everything off the counter',
          'Use antibacterial wipes',
          'Check around the faucet handle',
        ],
        verification: 'photo',
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
      // Self-care (no photo).
      {
        title: 'Brush teeth (morning + night)',
        blurb: 'Both. Every day. The whole two minutes.',
        kind: 'self-care',
        tips: [
          'Morning AND night',
          'Two whole minutes each time',
          'Floss at night',
        ],
        verification: 'checklist',
      },
      {
        title: 'Shower',
        blurb: 'Hair clean, body clean, towel hung up.',
        kind: 'self-care',
        tips: [
          'Hair: shampoo + condition',
          'Body: soap top to bottom',
          'Towel hung up, not on the floor',
        ],
        verification: 'checklist',
      },
      {
        title: 'Deodorant',
        blurb: 'Non-negotiable at this age.',
        kind: 'self-care',
        tips: [
          'After your shower works best',
          'Both armpits',
          'Cap on, lid closed',
        ],
        verification: 'checklist',
      },
      {
        title: 'Maintain bedroom (weekly)',
        blurb: 'A real clean — floor, surfaces, made bed, organized desk.',
        kind: 'bedroom',
        tips: [
          'Clear floor and surfaces first',
          'Bed made, laundry put away',
          'Trash out, desk organized',
        ],
        verification: 'photo',
      },
      {
        title: 'Wash own laundry',
        blurb: 'A load run start to finish: wash, dry, fold, put away.',
        kind: 'laundry',
        tips: [
          'Sort by color',
          'Don’t overfill the machine',
          'Move to dryer same day; fold within an hour',
        ],
        verification: 'photo',
      },
      {
        title: 'Clean the bathroom counter + sink',
        blurb: 'Surfaces sparkle; mirror is streak-free.',
        kind: 'bathroom',
        tips: [
          'Clear the counter',
          'Spray + wipe with antibacterial',
          'Mirror streak-free',
        ],
        verification: 'photo',
      },
      {
        title: 'Vacuum a common area',
        blurb: 'Living-room or hallway floor is visibly vacuumed.',
        kind: 'living',
        tips: [
          'Move chairs and small stuff first',
          'Edges + middle',
          'Empty the canister when done',
        ],
        verification: 'photo',
      },
      {
        title: 'Cook a simple meal',
        blurb: 'A meal they made shows on a plate — sandwich, eggs, pasta.',
        kind: 'kitchen',
        tips: [
          'Clean as you go',
          'Plate it like you’d serve a guest',
          'Wash the pan after',
        ],
        verification: 'photo',
      },
      {
        title: 'Take out trash + recycling',
        blurb: 'Both bins emptied and back in place; recycling sorted.',
        kind: 'kitchen',
        tips: [
          'Bag tied, fresh bag in',
          'Recycling sorted (no food)',
          'Both bins back outside',
        ],
        verification: 'photo',
      },
    ],
  },
  {
    minAge: 16,
    maxAge: 18,
    label: 'Ages 16–18',
    framing:
      'Older teens are nearly running their own life. Chores here should look like adulting reps.',
    chores: [
      {
        title: 'Maintain bedroom (weekly)',
        blurb: 'Clean, organized, no laundry pile.',
        kind: 'bedroom',
        tips: [
          'Floor clear, surfaces wiped',
          'Laundry caught up',
          'Trash and recycling out',
        ],
        verification: 'photo',
      },
      {
        title: 'Run own laundry routine',
        blurb: 'Their clothes are clean and put away on a weekly cadence.',
        kind: 'laundry',
        tips: [
          'Wash + dry same day',
          'Fold or hang within an hour',
          'Drawers, not the floor',
        ],
        verification: 'photo',
      },
      {
        title: 'Clean the bathroom (full)',
        blurb: 'Counter, sink, mirror, toilet all visibly clean.',
        kind: 'bathroom',
        tips: [
          'Counter and sink first',
          'Mirror streak-free',
          'Toilet and floor last',
        ],
        verification: 'photo',
      },
      {
        title: 'Cook a full family meal',
        blurb: 'A plated meal they made for the household.',
        kind: 'kitchen',
        tips: [
          'Plan and shop ahead',
          'Clean as you go',
          'Serve, eat, then wash',
        ],
        verification: 'photo',
      },
      {
        title: 'Vacuum + mop a room',
        blurb: 'Floor is visibly vacuumed and mopped, edges included.',
        kind: 'living',
        tips: [
          'Move furniture you can',
          'Vacuum first, then mop',
          'Get the edges',
        ],
        verification: 'photo',
      },
      {
        title: 'Wash the car',
        blurb: 'Exterior clean, no obvious dirt or streaks.',
        kind: 'outdoor',
        tips: [
          'Hose first, then soap',
          'Top down, edges + windows',
          'Rinse + dry to avoid spots',
        ],
        verification: 'photo',
      },
      {
        title: 'Mow the lawn',
        blurb: 'Lawn is evenly cut; edges trimmed.',
        kind: 'outdoor',
        tips: [
          'Edges first',
          'Overlap rows slightly',
          'Empty the bag as you go',
        ],
        verification: 'photo',
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
