/**
 * "Parent says X, kid hears Y" — curated paired examples.
 *
 * Each entry shows the same parenting moment two ways:
 *   - `harmful`: a phrase from the framework's flagged-as-harmful list
 *     (or close to it). What gets internalized. What the body does.
 *   - `regulated`: the Universal-Voice / Child-Voice version of the same
 *     moment. What gets internalized differently. What the body does instead.
 *
 * The pairs are surfaced in the parent's "Coaching → Parent says X, kid
 * hears Y" route, and (later) inline when the parent is composing an
 * override with a flagged phrase.
 *
 * Editing these:
 *   - These come from the framework. Edit with Erica.
 *   - Keep harmful + regulated parallel (same moment, same task) so the
 *     comparison teaches the lesson.
 *   - `kidHears` is the *internalization*, not the literal misunderstanding.
 *     It's what the nervous system stores, not what the ears process.
 *   - `bodyLanguage` is a short clause. Concrete, observable, no jargon.
 */

export type ExampleCategory =
  | 'after_partial'
  | 'after_forgot'
  | 'generic_vs_specific_praise'
  | 'when_stuck'
  | 'transition_in'
  | 'overwhelm'
  | 'repeated_coaching';

export type ExamplePanel = {
  parentSays: string;
  kidHears: string;
  bodyLanguage: string;
  /**
   * A single emoji that summarizes the body-language reaction. Used as a
   * visual anchor on the kid panel — *not* meant to be cute. Picked to
   * match nervous-system state, not facial expression theatrics.
   */
  bodyEmoji: string;
};

export type ParentSaysExample = {
  id: string;
  category: ExampleCategory;
  /** A short tag shown on the card so the parent can categorize at a glance. */
  momentLabel: string;
  /** One-sentence frame: when in real life does this moment happen? */
  setting: string;
  harmful: ExamplePanel;
  regulated: ExamplePanel;
};

export const EXAMPLE_CATEGORIES: { value: ExampleCategory; label: string }[] = [
  { value: 'after_partial', label: 'After partial completion' },
  { value: 'after_forgot', label: '"They forgot again"' },
  { value: 'generic_vs_specific_praise', label: 'Generic vs. specific praise' },
  { value: 'when_stuck', label: 'When the kid is stuck' },
  { value: 'transition_in', label: 'Starting a chore' },
  { value: 'overwhelm', label: 'When the kid is overwhelmed' },
  { value: 'repeated_coaching', label: 'After repeated coaching' },
];

/**
 * The curated library. Start with 7 pairs covering the most frequent
 * parent–kid pinch points. Erica will edit + expand.
 */
export const PARENT_SAYS_EXAMPLES: ParentSaysExample[] = [
  {
    id: 'partial-bed-shoes',
    category: 'after_partial',
    momentLabel: 'After partial completion',
    setting:
      "Your kid's room is mostly clean — bed made, shelves tidy — but shoes are still on the floor.",
    harmful: {
      parentSays: 'You missed multiple areas again.',
      kidHears: "I always mess up. They're keeping score.",
      bodyLanguage: 'Shoulders curl in, eyes drop, the room suddenly feels heavier.',
      bodyEmoji: '😔',
    },
    regulated: {
      parentSays: 'Strong work on the bed. One more move — shoes in the closet.',
      kidHears: "I did something right. There's one more thing.",
      bodyLanguage: 'Stands a little taller, looks at the shoes, hand reaches out.',
      bodyEmoji: '🙂',
    },
  },
  {
    id: 'forgot-trash',
    category: 'after_forgot',
    momentLabel: '"They forgot again"',
    setting:
      'Trash day was yesterday. The bins are still by the side of the house. You asked twice this week.',
    harmful: {
      parentSays: "You forgot again. Why can't you remember anything?",
      kidHears: 'My brain is broken. I am frustrating to live with.',
      bodyLanguage: 'Freeze response, eyes go far away, body braces.',
      bodyEmoji: '😶',
    },
    regulated: {
      parentSays: 'Quick reset: trash to the curb first.',
      kidHears: 'Oh, just that one thing. I can do that.',
      bodyLanguage: 'Turns toward the door, picks up the pace.',
      bodyEmoji: '👍',
    },
  },
  {
    id: 'great-job-vs-specific',
    category: 'generic_vs_specific_praise',
    momentLabel: 'Generic vs. specific praise',
    setting:
      "Your kid finished a chore and is showing it to you. They want you to look.",
    harmful: {
      parentSays: 'Great job!',
      kidHears: "They didn't actually look. They say that to everyone.",
      bodyLanguage: 'A brief smile, then disengages, drifts away from the work.',
      bodyEmoji: '😐',
    },
    regulated: {
      parentSays: 'I see how carefully you smoothed the pillow.',
      kidHears: 'They actually saw what I did. I made that nice.',
      bodyLanguage: 'Eyes brighten, leans back toward the work, points to one more detail.',
      bodyEmoji: '😊',
    },
  },
  {
    id: 'stuck-mid-task',
    category: 'when_stuck',
    momentLabel: 'When the kid is stuck',
    setting:
      "Your kid started the chore but they've been standing in one place for two minutes, looking at the mess.",
    harmful: {
      parentSays: "What's so hard about this? Just do it.",
      kidHears: "They think I'm stupid. I'm supposed to know this already.",
      bodyLanguage: 'Shutdown — looks at the floor, hands go to pockets, no movement.',
      bodyEmoji: '😞',
    },
    regulated: {
      parentSays: 'What part felt tricky?',
      kidHears: "They want to help. It's okay that this part is hard.",
      bodyLanguage: 'Looks up, points at the hard part, words start coming.',
      bodyEmoji: '🤔',
    },
  },
  {
    id: 'transition-now',
    category: 'transition_in',
    momentLabel: 'Starting a chore',
    setting:
      "Your kid is in the middle of something — building, drawing, gaming — and it's time to switch to a chore.",
    harmful: {
      parentSays: "Stop what you're doing and do your chores right now.",
      kidHears: "What I'm doing doesn't matter. Mom is annoyed.",
      bodyLanguage: 'Resistance — body angles away, jaw tightens, "five more minutes".',
      bodyEmoji: '😤',
    },
    regulated: {
      parentSays: 'Five-minute warning, then bed-making time.',
      kidHears: 'I have a runway. I get to finish my thing.',
      bodyLanguage: 'Nods, glances at what they were doing, starts planning the transition.',
      bodyEmoji: '😌',
    },
  },
  {
    id: 'overwhelm-big-room',
    category: 'overwhelm',
    momentLabel: 'When the kid is overwhelmed',
    setting:
      "The room is a disaster. Your kid is standing in the doorway, frozen — they don't know where to begin.",
    harmful: {
      parentSays: 'You need to take more responsibility around here.',
      kidHears: 'I am the problem. I am a burden.',
      bodyLanguage: 'Shame posture — shoulders roll forward, eyes wet, breathing shallow.',
      bodyEmoji: '😢',
    },
    regulated: {
      parentSays: 'Hero mission — clothes in the basket first.',
      kidHears: 'One clear thing. I can do that.',
      bodyLanguage: 'Nods, walks to the basket, picks up the first shirt.',
      bodyEmoji: '💪',
    },
  },
  {
    id: 'repeated-coaching',
    category: 'repeated_coaching',
    momentLabel: 'After repeated coaching',
    setting:
      "You've reminded your kid about this same step on three different days this week.",
    harmful: {
      parentSays: "I've told you three times — try harder.",
      kidHears: 'I am exhausting. Even trying is failing.',
      bodyLanguage: 'Collapse — sits down on the floor, hands go limp.',
      bodyEmoji: '😩',
    },
    regulated: {
      parentSays: 'That was a hard one, and you kept going.',
      kidHears: 'Even when it is hard, they see my effort.',
      bodyLanguage: 'Looks back at the task with new energy, stands up.',
      bodyEmoji: '🙂',
    },
  },
];

export const findExamplesByCategory = (
  category: ExampleCategory | 'all'
): ParentSaysExample[] =>
  category === 'all'
    ? PARENT_SAYS_EXAMPLES
    : PARENT_SAYS_EXAMPLES.filter((e) => e.category === category);
