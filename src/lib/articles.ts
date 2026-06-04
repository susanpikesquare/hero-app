/**
 * Parent-facing context articles surfaced in the app. One per age bucket,
 * matching the chore suggestions in src/lib/chore-suggestions.ts.
 *
 * Positioning (per Erica's June 3 working session + Workbook Q3.1):
 * These are NOT parenting advice. They explain the thinking behind
 * what the app is recommending — why this chore at this age, why this
 * many tasks per day, why a kid with executive-function load might
 * need a smaller step. The content synthesizes published developmental
 * guidance into short reads.
 *
 * Voice rules:
 *   - Context, not coaching. Avoid "your job is to..." / "the move is..."
 *   - Frame in terms of what kids at this age tend to be ready for, not
 *     what a parent should do.
 *   - When citing developmental claims, name the source (CDC, AAP, etc.).
 *   - Universal voice: works for any kid, with an optional neurodivergence
 *     paragraph that surfaces in the UI only when the kid's
 *     `neurodivergence_context` is set.
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
  /** Published sources synthesized into the article. Shown as a small
   *  citation block at the bottom so parents can see where the
   *  developmental claims come from. */
  sources?: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: 'ages-4-to-5-early-participation',
    title: 'Early participation: ages 4–5.',
    blurb:
      'What 4–5-year-olds tend to be ready for — and why Home Hero starts so small at this age.',
    ageBucket: { min: 4, max: 5 },
    eyebrow: 'Ages 4–5 · Preschool & Kindergarten',
    intro: [
      "Published developmental guidance (CDC, AAP) describes ages 4–5 as a stage of emerging participation — kids are wired to imitate household work and absorb routines, but executive function is still highly immature.",
      "That's why Home Hero starts this age bucket with one or two small, observable chores rather than a routine. The app isn't asking a 5-year-old to manage anything — it's giving them repeated experience of a completed contribution.",
    ],
    sections: [
      {
        heading: "What kids 4–5 are typically ready for",
        paragraphs: [
          "Single-step, concrete tasks that take under five minutes — put shoes on the rack, put one toy back in the bin, pull the blanket up. Multi-step routines (\"get ready for bed including brushing teeth and pajamas\") are usually beyond this age band, because working memory at 4–5 can typically only hold one to two items at a time.",
          "Attention spans of three to five minutes on a single task are typical at this age. Done means the action happened — not that the outcome matches an adult standard.",
        ],
      },
      {
        heading: "Why Home Hero suggests so few chores at this age",
        paragraphs: [
          "The app's soft-warning ceiling for this age band sits around 2 daily tasks. That's not arbitrary — it reflects published guidance that piling on tasks at this developmental stage tends to produce more friction than learning.",
          "The reference photo and three short tips on each chore tile exist for the same reason: visual support is the dominant scaffold at this age, because reading is just emerging and verbal-only instructions tend to be forgotten between rooms.",
        ],
      },
      {
        heading: "If you've set the neurodivergence context",
        paragraphs: [
          "When a 4–5-year-old's `neurodivergence_context` is set to neurodivergent, the app starts at the lower end of the suggested range (1 daily task, not 2) and leans more heavily on the visual reference. This reflects guidance that transitions and task initiation tend to be more taxing at this age when executive-function load is heightened.",
          "You can override the defaults from kid settings anytime if your family is ready for more or wants less.",
        ],
      },
    ],
    takeaway:
      "At this age, the win is the repetition of being someone who participates. The skill catches up later — published research says executive function continues maturing well into the twenties.",
    sources: [
      "CDC — Child Development Milestones, ages 4–5",
      "AAP HealthyChildren.org — Age-appropriate chores",
    ],
  },
  {
    slug: 'ages-6-to-8-emerging-independence',
    title: 'Emerging independence: ages 6–8.',
    blurb:
      'Why early elementary is the first age the app suggests standalone chores.',
    ageBucket: { min: 6, max: 8 },
    eyebrow: 'Ages 6–8 · Early Elementary',
    intro: [
      "Around age 6, published developmental guidance describes a meaningful shift: kids can hold two to three sequential steps in working memory, recognize a finished outcome against a reference, and start completing chores independently.",
      "That's why Home Hero introduces standalone photo-verified chores at this age, and why the daily task ceiling moves up from the 4–5 range.",
    ],
    sections: [
      {
        heading: "What kids 6–8 are typically ready for",
        paragraphs: [
          "Two- and three-step tasks they can finish without help — make the bed, pack the backpack, tidy a small area. Time concepts (\"in 10 minutes\") are still abstract; visual countdowns work better than verbal ones at this age.",
          "Reading is emerging but inconsistent. The three coaching tips on each chore tile are capped short because longer instructions tend to be skimmed or lost.",
        ],
      },
      {
        heading: "Why Home Hero leans on the reference photo at this age",
        paragraphs: [
          "Self-assessment — the ability to look at one's own work and tell whether it matches the target — is a skill that emerges through this age band. The reference photo on each tile gives kids a concrete, side-by-side target rather than asking them to hold the standard in their head.",
          "The soft-warning ceiling at 6–8 sits around 3–5 daily tasks. Above that, published guidance suggests the load tends to break the contribution experience rather than build it.",
        ],
      },
      {
        heading: "If you've set the neurodivergence context",
        paragraphs: [
          "When a 6–8-year-old's context is set to neurodivergent, the app pre-seeds higher visual reliance and more frequent reminders, and tends toward the lower end of the daily ceiling. This reflects developmental guidance that task-initiation lag is most pronounced at this age when executive-function support is needed.",
          "After-school dysregulation is also documented as more intense at this age when EF load is high — published guidance suggests not scheduling the hardest task for that window.",
        ],
      },
    ],
    takeaway:
      "6–8 is the first age the app expects independent completion. The reference photo, the short tips, and the conservative ceiling all exist to make that independence learnable.",
    sources: [
      "CDC — Child Development Milestones, ages 6–8",
      "AAP HealthyChildren.org — Age-appropriate chores",
    ],
  },
  {
    slug: 'ages-9-to-12-skill-building',
    title: 'Skill-building & responsibility: ages 9–12.',
    blurb:
      "Why the app starts assigning multi-step weekly chores in this age band.",
    ageBucket: { min: 9, max: 12 },
    eyebrow: 'Ages 9–12 · Late Elementary & Tween',
    intro: [
      "Around age 10, published guidance describes a meaningful jump in planning capacity: kids can hold a multi-step task in their head, sequence it, and own a recurring weekly responsibility.",
      "That's why Home Hero's suggestions in this age band start mixing in weekly chores alongside daily ones — and why reward weights start to matter more.",
    ],
    sections: [
      {
        heading: "What kids 9–12 are typically ready for",
        paragraphs: [
          "Multi-step tasks with a clear sequence — clean the bathroom, change bed linens, put together a simple meal. Planning skill is emerging unevenly at this age: the same kid can plan a complex multi-day project in theory and still forget to start their actual chore.",
          "The gap between \"what they can do\" and \"what they consistently do\" widens at this age across all kids, per published developmental research. The app reflects this with reward weights — a real ownership chore (weekly bedroom clean) is weighted higher than a daily quick win.",
        ],
      },
      {
        heading: "Why the app introduces self-care chores here",
        paragraphs: [
          "Self-care chores (brush teeth, shower, deodorant) typically transition from supported to independent during this age band. Home Hero marks these as checklist chores rather than photo chores — photographing a kid's body or routines is a line the app deliberately doesn't cross.",
          "The daily ceiling at 9–12 is the app's most flexible. Published guidance generally supports 3–7 daily tasks at this age, but the right number depends on the kid and what else they're carrying (school load, activities, sleep).",
        ],
      },
      {
        heading: "If you've set the neurodivergence context",
        paragraphs: [
          "When a 9–12-year-old's context is set to neurodivergent, the app keeps multi-step chores in the picture but breaks them down further on the tile — more sub-steps in the coaching tips, more reminders, lower starting reward weights so the kid experiences early wins.",
          "The 9–12 band is also when published research suggests the self-narrative around \"I am bad at this\" can solidify if scaffolding is too thin. The app's encouragement-first feedback is tuned with that finding in mind.",
        ],
      },
    ],
    takeaway:
      "9–12 is the rehearsal for the teenage years. The patterns of ownership, weekly cadence, and self-assessment that land now are the ones that hold into 13+.",
    sources: [
      "CDC — Child Development Milestones, ages 9–11",
      "AAP HealthyChildren.org — Age-appropriate chores",
      "Cleveland Clinic — Executive function development",
    ],
  },
  {
    slug: 'ages-13-to-15-expanding-autonomy',
    title: 'Expanding autonomy: ages 13–15.',
    blurb:
      'Why the kid surface changes voice at 13 and what published guidance says about teen executive function.',
    ageBucket: { min: 13, max: 15 },
    eyebrow: 'Ages 13–15 · Early Teen',
    intro: [
      "Published developmental research describes adolescence as a period of identity formation, peer-mediated learning, and uneven executive function maturation. Home Hero responds with a meaningfully different surface at this age.",
      "The kid view drops the bunny mascot, drops the \"hero\" framing, and shifts to a peer/coach voice when the kid's mode is teen (default at 13–15). This isn't a cosmetic choice — published guidance on teen psychology suggests an app that reads as \"for kids\" tends to be disengaged from at this age.",
    ],
    sections: [
      {
        heading: "What kids 13–15 are typically ready for",
        paragraphs: [
          "Domain-level ownership — a full bedroom, a laundry cycle, a weekly contribution to family meals. Complex multi-step tasks are within reach, but follow-through is documented as wildly inconsistent at this age across all kids.",
          "Published research consistently notes that full executive function maturation runs into the mid-to-late twenties. Procrastination spirals and weeks-long gaps are developmentally typical, not character flaws.",
        ],
      },
      {
        heading: "Why the app suggests fewer, bigger chores at this age",
        paragraphs: [
          "Daily ceilings drop at 13–15 because published guidance supports replacing quantity with depth at this age. One real domain owned well is more developmentally useful than five small daily tasks.",
          "The override flow is also tuned for this age band. \"Good enough for today\" is documented as one of the highest-leverage parenting tools during the early teen years, because public correction or anything that reads as criticism tends to erode the relationship faster than at younger ages.",
        ],
      },
      {
        heading: "If you've set the neurodivergence context",
        paragraphs: [
          "When a 13–15-year-old's context is set to neurodivergent, the app keeps the teen voice but increases the scaffolding underneath — more steps in the coaching tips, more reminders, longer transition windows. Published guidance suggests the EF gap between \"knows how\" and \"consistently does\" is most pronounced at this age when load is heightened.",
          "If your teen prefers the original surface (mascot, \"hero\" framing), you can override the mode in kid settings. Home Hero's design honors that developmental difference isn't determined by birthday.",
        ],
      },
    ],
    takeaway:
      "Early teens are practicing being adults in your house. The app's voice, ceiling, and override language are all tuned around that — not around chore completion as an end in itself.",
    sources: [
      "AAP HealthyChildren.org — Teen development & responsibilities",
      "Cleveland Clinic — Executive function development",
      "Common Sense Media — Age-appropriate expectations",
    ],
  },
  {
    slug: 'ages-16-to-18-functional-independence',
    title: 'Functional independence: ages 16–18.',
    blurb:
      'Why the kid surface becomes a co-piloted life-skills tracker, not a chore app.',
    ageBucket: { min: 16, max: 18 },
    eyebrow: 'Ages 16–18 · Older Teen',
    intro: [
      "By 16, published developmental guidance describes kids as practicing the systems they'll use as adults — laundry, cooking, scheduling, money. Home Hero responds by shifting the kid surface (peer mode by default at 16+) into something that reads more like a shared household OS than a chore app.",
      "The framing here matters. Older teens are documented as resenting management language; the app uses contribution language instead — \"your share of the household\" rather than \"your chores.\"",
    ],
    sections: [
      {
        heading: "What older teens are typically ready for",
        paragraphs: [
          "Adult-shaped tasks — cooking a real meal, running a full laundry cycle, cleaning a bathroom to a hosting standard, managing personal scheduling. Published guidance suggests these are the highest-leverage tasks at this age because they directly rehearse post-launch life.",
          "Older teens still crash. Published research is consistent that EF capacity remains uneven at this age — a week of total slide is developmentally typical, not a sign of regression.",
        ],
      },
      {
        heading: "Why the daily list shrinks at 16+",
        paragraphs: [
          "The app's suggested daily ceiling at 16+ is the lowest of any age band. That's intentional. Published guidance supports the framing that the goal at this age isn't chore completion — it's the kid practicing a system they'll continue using when no one's reminding them.",
          "The kid surface drops most of the celebration/reward visual treatment in peer mode. Hops and streaks read as childish to older teens; the surface becomes a simple completion log.",
        ],
      },
      {
        heading: "If you've set the neurodivergence context",
        paragraphs: [
          "When a 16–18-year-old's context is set to neurodivergent, the app keeps the peer mode but holds onto stronger scaffolding underneath — more explicit transition windows, more frequent reminders, smaller cognitive jumps between steps.",
          "Published research on executive function development supports the framing that EF maturation often runs later for neurodivergent older teens — into the late twenties for many. The app's design treats that as a normal pace, not a verdict.",
        ],
      },
    ],
    takeaway:
      "Two years from launch, your teen is rehearsing the systems they'll run on their own. The app's role at this age is the shared accountability surface — they're meant to be running most of it themselves.",
    sources: [
      "AAP HealthyChildren.org — Teen development & responsibilities",
      "Common Sense Media — Older teens & autonomy",
      "Cleveland Clinic — Executive function development",
    ],
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
