/**
 * Parent-facing articles surfaced in the app. One per age bucket, matching
 * the chore suggestions in src/lib/chore-suggestions.ts.
 *
 * These are auto-drafted placeholders to get the surface working. Erica
 * (LMFT) will rewrite them in her own voice. The data shape is stable —
 * adding/editing articles only requires editing this file.
 *
 * Voice rules borrowed from Erica's review of the v1 spec:
 *   - Connection over correction. Always.
 *   - Encouragement-first, never punitive.
 *   - "From home life feeling like a chore to cheerful."
 *   - Give parents confidence to set expectations with boundaries,
 *     structure, and accountability.
 */

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type Article = {
  slug: string;
  title: string;
  /** One-sentence summary used on cards. */
  blurb: string;
  /** Inclusive age range the article is written for. */
  ageBucket: { min: number; max: number };
  /** Short eyebrow line above the title. */
  eyebrow: string;
  /** Opening paragraph(s), shown before any section heading. */
  intro: string[];
  sections: ArticleSection[];
  /** One- or two-sentence closing line in italic-like emphasis. */
  takeaway: string;
};

export const ARTICLES: Article[] = [
  {
    slug: 'ages-4-to-6-tiny-chores-huge-wins',
    title: 'Tiny chores, huge wins.',
    blurb:
      'At 4–6, the win is the experience of contributing — not the perfect outcome.',
    ageBucket: { min: 4, max: 6 },
    eyebrow: 'Ages 4–6 · Preschool & Kindergarten',
    intro: [
      "Kids this age are wired to help. You've probably noticed: a four-year-old will offer to sweep with enthusiasm that fades by middle school. Catch that window. The goal at this stage isn't a sparkling room — it's the experience of being someone who contributes to the home.",
      "Done is doing it. A pillow on the bed counts as made. Three toys back in the bin counts as tidied. Your kid is wiring their own self-image right now, and what we want them to learn is, ‘I am a person who helps.’",
    ],
    sections: [
      {
        heading: 'What to actually expect',
        paragraphs: [
          "They will need help. They will get distracted. They will leave half the toys out and call it done. That isn't failure — that's developmentally on track.",
          "The version of clean a 5-year-old can hold in their head is much smaller than yours. Pick one or two specific chores ('toys in the bin,' 'shoes on the shelf') and let them own those. Save the rest for older years.",
        ],
      },
      {
        heading: 'Structure + boundaries at this age',
        paragraphs: [
          "Same chore, same time, every day. Routine is regulation at this age. ‘After breakfast, we make the bed’ becomes muscle memory faster than any reward system.",
          "Keep the chore small enough that they can finish it before they lose interest. A 4-year-old's attention span on a single task is about three to five minutes. Honor that.",
        ],
      },
      {
        heading: 'Connection over correction',
        paragraphs: [
          "If the bed is lumpy and the pillow is on the floor, the move is not to remake it ‘properly.’ The move is to notice them noticing it: ‘You made your bed today. That helps our home feel calm.’",
          "When they're not quite there, narrate the effort, not the gap. ‘I can see you pulled the blanket up — that was hard for those little arms.’ Then, only if the moment is right, ‘Want to try one more pull together?’",
        ],
      },
    ],
    takeaway:
      "At this age, every chore is a relationship deposit. Build the helper they already want to be — the technique catches up later.",
  },
  {
    slug: 'ages-7-to-9-real-chores-real-ownership',
    title: 'Real chores, real ownership.',
    blurb:
      'Early elementary kids can complete a task start-to-finish. Your job shifts from doing-with-them to trusting them.',
    ageBucket: { min: 7, max: 9 },
    eyebrow: 'Ages 7–9 · Early Elementary',
    intro: [
      "Around 7, something clicks: kids can plan a multi-step task and actually finish it. They can pack their backpack, feed the pet, make their bed in a way that holds up to a photo.",
      "Your job is shifting from ‘doing it together’ to ‘holding the standard while they do it.’ That shift is where most parent-kid chore friction starts — and where this app is most useful.",
    ],
    sections: [
      {
        heading: 'What to actually expect',
        paragraphs: [
          "Their version of done is going to be a notch below yours. That's not laziness — that's age. A 7-year-old genuinely sees ‘fine’ where you see ‘the corners of the blanket are bunched up.’",
          "Stay focused on two questions: Is the chore done well enough that the room functions? Is your kid practicing the skill of completing it? If both answers are yes, the chore is done.",
        ],
      },
      {
        heading: 'Structure + accountability',
        paragraphs: [
          "Weekly chores work better than daily ones at this age — pick a day, make it the same every week, and protect it. ‘Sunday morning is room day’ becomes a household rhythm rather than a daily nag.",
          "Accountability at 7–9 looks like a check-in, not an inspection. Five minutes, side-by-side, looking at the photo together: ‘Walk me through what you did.’ That conversation is the point.",
        ],
      },
      {
        heading: 'Connection over correction',
        paragraphs: [
          "When the chore isn't quite right, the encouragement-first move is to lead with what they got right. ‘Your bed is so much neater than yesterday. Let's see if we can tackle the toys next.’",
          "Save the correction for one thing per check-in. Two corrections feels like a list of failures; one feels like coaching. Pick the most-important-one and let the rest go until next week.",
        ],
      },
    ],
    takeaway:
      "If your 8-year-old can do the chore start to finish — even imperfectly — that's the win. Their standards will rise with their age. Your relationship is what we're protecting today.",
  },
  {
    slug: 'ages-10-to-12-systems-not-tasks',
    title: 'Systems, not tasks.',
    blurb:
      'Tweens can handle multi-step chores AND manage a system. This is where ‘run the household together’ starts.',
    ageBucket: { min: 10, max: 12 },
    eyebrow: 'Ages 10–12 · Late Elementary & Tween',
    intro: [
      "By 10, kids can hold ‘run the system’ in their head, not just ‘do the chore.’ They can pack their own lunches the night before, manage a weekly laundry load, and remember that the dishwasher needs unloading without you bringing it up.",
      "This is the age where executive function makes a leap. Your job is to load them up with chores that exercise that muscle — not just a list of tasks, but ownership over a small domain.",
    ],
    sections: [
      {
        heading: 'What to actually expect',
        paragraphs: [
          "Their consistency will be uneven. Two great weeks then a meltdown about taking out the trash — that's normal. The variability is part of how they're growing, not evidence that ‘they can't do it.’",
          "Expect them to push back. ‘Why do I have to?’ is not insubordination at this age — it's their brain practicing self-advocacy. Honor the question with a real answer; don't dismiss it.",
        ],
      },
      {
        heading: 'Boundaries that build confidence',
        paragraphs: [
          "Be specific about the outcome, then loose about the process. ‘Your laundry is washed, folded, and put away by Sunday night’ gives them autonomy. ‘Wash your laundry at 4pm on Saturday’ doesn't.",
          "Hold the line on the outcome. The boundary you're modeling is, ‘In this house, agreements get kept.’ That's a life skill far more important than a clean room.",
        ],
      },
      {
        heading: 'Connection over correction',
        paragraphs: [
          "The temptation at this age is to escalate. ‘How many times do I have to ask?’ ‘What is wrong with you?’ — both come from frustration, both damage connection. Neither gets the chore done.",
          "When you feel the escalation rising, name what's happening to yourself first: ‘I'm frustrated.’ Then come back to the chore with: ‘Let's look at this together — what got in the way?’ That curiosity is what teaches them to look at their own behavior.",
        ],
      },
    ],
    takeaway:
      "10–12 is rehearsal for the teenage years. The habits of ownership, agreement-keeping, and conversation-after-friction that land now are the ones that hold through 13–17.",
  },
  {
    slug: 'ages-13-to-15-domain-ownership',
    title: 'Domain ownership.',
    blurb:
      'Early teens can fully own a room, a routine, or a household responsibility. Your role becomes coach, not manager.',
    ageBucket: { min: 13, max: 15 },
    eyebrow: 'Ages 13–15 · Early Teen',
    intro: [
      "13 is when the relationship dynamic around chores can quietly shift from cooperation to power struggle — unless you intentionally rebuild it.",
      "Teens this age can take total ownership of a domain: their room, their laundry, a weekly meal they cook. Your job is to step out of the management role and into a coaching one. That move is what keeps the chore-conversation from becoming The Chore Conversation™.",
    ],
    sections: [
      {
        heading: 'What to actually expect',
        paragraphs: [
          "They're going to test the boundary. They'll let the room slide for a week, see how you respond, and recalibrate. That's healthy. It's also exhausting. Both can be true.",
          "Their identity is forming around what they're good at — and ‘good at running a corner of the household’ is a wildly valuable identity to graduate them into.",
        ],
      },
      {
        heading: 'Boundaries, structure, accountability',
        paragraphs: [
          "Make agreements explicit. ‘You're responsible for your laundry. Done by Sunday means clean, folded, and in drawers. If it's not, here's what happens.’ Write the agreement down if it helps.",
          "Hold the consequence calmly. Phones, screen time, weekend plans — pick a meaningful one and apply it without lecturing. The consequence does the teaching; you don't have to.",
          "Praise the system, not just the result. ‘You ran your laundry without me reminding you — that's the kind of person you're becoming.’",
        ],
      },
      {
        heading: 'Connection over correction',
        paragraphs: [
          "At this age, your kid's hearing for criticism is exquisite. Even gentle feedback can land as ‘you think I'm a failure.’ Lead with curiosity: ‘What was happening this week? You didn't get to your room.’",
          "The repair, not the lecture, is what builds the relationship. After a tough moment, come back: ‘I was frustrated earlier. I still expect the laundry, and I still love you. Both true.’",
        ],
      },
    ],
    takeaway:
      "Early teens are practicing being an adult under your roof. Your job isn't to keep them small; it's to coach them toward someone you'd want as a roommate.",
  },
  {
    slug: 'ages-16-plus-rehearsal-for-adulthood',
    title: 'Rehearsal for adulthood.',
    blurb:
      'By 16, your kid is two years from running their own household. Treat home like the dress rehearsal.',
    ageBucket: { min: 16, max: 25 },
    eyebrow: 'Ages 16+ · Older Teen',
    intro: [
      "The frame at 16+ shifts from ‘kid doing chores’ to ‘young adult practicing adulthood under a roof.’ That re-framing changes everything — for them and for you.",
      "If they can't cook a meal, run a load of laundry, or clean a bathroom by the time they leave home, the home didn't teach them. Now is when the teaching counts.",
    ],
    sections: [
      {
        heading: 'What to actually expect',
        paragraphs: [
          "They will resent feeling ‘managed.’ They're old enough to feel the difference between being asked and being told, and old enough to push back on the latter. That's appropriate.",
          "They will also occasionally crash — a week where everything slides because school, friends, or feelings overflowed. That's also appropriate. Adulthood includes crash weeks.",
        ],
      },
      {
        heading: 'Boundaries between adults-in-training',
        paragraphs: [
          "Frame chores as their share of running the household, not as tasks you assign. ‘You live here, here's your share’ is a fundamentally different conversation than ‘do this because I said so.’",
          "When they fall short, the conversation is, ‘What's the agreement, and is it still working?’ — not, ‘Why aren't you doing what I said?’ That respect builds the kind of agency that holds when you're not in the room.",
        ],
      },
      {
        heading: 'Connection over correction',
        paragraphs: [
          "The danger at this age is that the chore-conversation eats the whole relationship. Don't let it. For every chore-related interaction, find three that are just human-to-human: their music, their friends, the thing they're excited about.",
          "Your teenager remembers the tone, not the words. ‘You handled that this week’ said warmly outlasts a hundred lectures.",
        ],
      },
    ],
    takeaway:
      "Two years from now, they'll be running their own kitchen, their own laundry, their own life. Right now you're the home that taught them they could.",
  },
];

export function articleForAge(age: number | null | undefined): Article | null {
  if (typeof age !== 'number') return ARTICLES[1] ?? null;
  return (
    ARTICLES.find(
      (a) => age >= a.ageBucket.min && age <= a.ageBucket.max
    ) ?? null
  );
}

export function articleBySlug(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
