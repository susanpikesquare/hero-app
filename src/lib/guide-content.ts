/**
 * Customer-facing guide content for /guide.
 *
 * Susan can share the URL with prospective customers, Erica, demo
 * families, anyone evaluating the app. The renderer (src/app/guide.tsx)
 * walks this structure top-to-bottom; section anchors come from `id`.
 *
 * Voice notes:
 *   - Clinical-with-warmth (parent-facing). Never marketing-y.
 *   - Encouragement-first phrasing throughout, matching Erica's voice.
 *   - When quoting from the app's actual copy (override reasons, status
 *     badges), use the exact strings — they're a feature, not flavor.
 *
 * If you add a new feature, add a section here AND a TOC entry below.
 */

export const GUIDE_UPDATED = 'May 2026';

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'bullets'; items: string[] }
  | {
      type: 'steps';
      items: { n: string; title: string; body: string }[];
    }
  | {
      type: 'callout';
      tone?: 'accent' | 'info' | 'warm';
      eyebrow?: string;
      title?: string;
      body: string;
      lines?: string[];
    }
  | {
      type: 'definitions';
      items: { term: string; body: string }[];
    };

export type GuideSection = {
  id: string;
  eyebrow: string;
  title: string;
  blocks: GuideBlock[];
};

export const GUIDE_TOC: { id: string; label: string }[] = [
  { id: 'what-it-is', label: 'What Home Hero is' },
  { id: 'who-its-for', label: 'Who it’s for' },
  { id: 'how-it-works', label: 'How it works in three steps' },
  { id: 'setting-up', label: 'Setting up your family' },
  { id: 'daily-flow', label: 'The daily flow' },
  { id: 'parent-override', label: 'The parent override' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'progress', label: 'Progress and coaching' },
  { id: 'two-surfaces', label: 'Web and iOS — what each is for' },
  { id: 'privacy', label: 'Privacy and your child’s data' },
  { id: 'getting-help', label: 'Getting help' },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'what-it-is',
    eyebrow: 'The big idea',
    title: 'Clinical standards, in your kitchen.',
    blocks: [
      {
        type: 'p',
        text: 'Home Hero is an AI-validated chore app built for households with ADHD kids. A licensed therapist sets the clinical standard for what "done" looks like, our AI checks each photo your child submits against that standard, and you stay in charge of every final call — with one-tap encouragement-first reasons that protect the relationship while you protect the standard.',
      },
      {
        type: 'p',
        text: 'It is not a chore chart, and it is not a behavior tracker. It is a system that quietly redistributes the invisible labor of remembering, reminding, re-checking, and re-correcting — so one nervous system stops carrying the whole home.',
      },
      {
        type: 'callout',
        tone: 'accent',
        eyebrow: 'Three things we believe',
        body: 'These shape every screen of the app.',
        lines: [
          'Clinical standards belong in the kitchen, not just the therapy office.',
          'Less nagging is the real reward — for the whole family.',
          'Feedback is always connection over correction.',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'who-its-for',
    eyebrow: 'Who Home Hero is built for',
    title: 'Families where one person has been carrying everything.',
    blocks: [
      {
        type: 'p',
        text: 'Home Hero is specifically designed for families with ADHD kids ages 5–16, though it works for siblings of any wiring. If any of the following sound familiar, this app was built for you:',
      },
      {
        type: 'bullets',
        items: [
          'One parent has quietly become the family’s air-traffic controller — tracking, reminding, enforcing, correcting, following up.',
          'Chore systems you’ve tried fall apart in 3 days because the kid technically "did" the task but the result wasn’t what you meant.',
          'The line between "parent" and "manager" has blurred, and so has the line between "feedback" and "criticism."',
          'You suspect the invisible labor is damaging the relationships the home is supposed to protect.',
        ],
      },
      {
        type: 'p',
        text: 'It is also designed to be used alongside a licensed therapist or family coach who already knows your home. The clinical phrasing throughout the app — especially the override reasons — was written by a Licensed Marriage and Family Therapist who works with ADHD families every week.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'how-it-works',
    eyebrow: 'How it works',
    title: 'Three steps. One bedroom to start.',
    blocks: [
      {
        type: 'p',
        text: 'Home Hero starts with the single hardest chore in most ADHD homes — a tidy bedroom with a made bed — and gets that loop bulletproof before expanding into the rest of the house.',
      },
      {
        type: 'steps',
        items: [
          {
            n: '01',
            title: 'Set the standard.',
            body: 'Each chore starts from a therapist-designed reference photo — what "done" actually looks like. After a few rounds, you upload your own reference photo so your kid’s real clean space becomes the bar to clear.',
          },
          {
            n: '02',
            title: 'Your kid submits.',
            body: 'When the chore is done, your kid opens the app, taps the chore, and takes a photo. The AI compares their photo to your standard and writes back kind, specific feedback in seconds.',
          },
          {
            n: '03',
            title: 'You stay in charge.',
            body: 'You see every submission in your queue. Approve, ask for one more pass, or override with a one-tap reason that lets your kid know exactly where they stand without damaging the relationship.',
          },
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'setting-up',
    eyebrow: 'Getting started',
    title: 'Setting up your family.',
    blocks: [
      {
        type: 'p',
        text: 'Setup takes about ten minutes and is done by the parent on the web at hero-app-pied-three.vercel.app or through the iOS app from TestFlight (invite required during the v0 pilot).',
      },
      {
        type: 'h3',
        text: 'Sign up',
      },
      {
        type: 'p',
        text: 'Use an email and password. Your account is the parent account — it owns the family, decides who can join, and is the only login that can override chore submissions. You confirm at signup that you are at least 18 and the parent or guardian of any children whose info you provide.',
      },
      {
        type: 'h3',
        text: 'Add your kids',
      },
      {
        type: 'p',
        text: 'For each child, give us their first name (or display name — Buddy works too) and their age. Age is used to suggest age-appropriate chores from a curated library. You can edit or remove a child at any time from the dashboard.',
      },
      {
        type: 'h3',
        text: 'Pick chores',
      },
      {
        type: 'p',
        text: 'After adding a kid, you’ll see a list of suggested chores based on their age — bed-making and backpack-packing for younger kids, simple cooking and laundry for older. Tap to add the ones that fit your home and skip the ones that don’t. You can also create custom chores ("Feed the lizard"), mark any chore as required or optional (optional chores show in a separate "extras" section for the kid), and assign a reward weight if you’re using rewards.',
      },
      {
        type: 'h3',
        text: 'Choose a reward style',
      },
      {
        type: 'p',
        text: 'In Family Settings, pick what motivates your kid: hops, stars, badges, or off entirely. The reward style shows up on the kid’s view as encouragement, never as a leverage point.',
      },
      {
        type: 'callout',
        tone: 'info',
        eyebrow: 'A note on reference photos',
        body: 'For your first chore, you can use the therapist-designed reference that ships with the app. Once your kid has actually cleaned their own room a few times — to your standard, in your home — replace the reference with a photo of YOUR house in its target state. Your kid’s real clean room becomes the bar. This is the single highest-impact thing you can do in the app.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'daily-flow',
    eyebrow: 'Day-to-day use',
    title: 'What the daily loop feels like.',
    blocks: [
      {
        type: 'h3',
        text: 'On the kid’s side',
      },
      {
        type: 'p',
        text: 'Your kid opens the app (on a shared device after you "Hand to" them, or on their own iPhone after joining with a one-time code) and sees a friendly, bunny-mascot-flavored home screen with their first name, today’s required chores, and any extras. Each chore tile shows a status badge:',
      },
      {
        type: 'definitions',
        items: [
          {
            term: '📸 Ready when you are',
            body: 'Chore is open — tap to submit a photo whenever it’s done.',
          },
          {
            term: '⏳ Waiting on your grown-up',
            body: 'Photo submitted, AI saw it, parent hasn’t weighed in yet.',
          },
          {
            term: '✓ Done today!',
            body: 'Approved — either by the AI or by you with an override.',
          },
          {
            term: '🔁 Your grown-up wants another go',
            body: 'AI or parent asked for one more pass. The kid sees an encouraging reason, not just a "rejection."',
          },
        ],
      },
      {
        type: 'p',
        text: 'When the kid submits a photo, the AI returns a verdict in 5–10 seconds. If it’s approved cleanly, they see celebration and (if rewards are on) their hop / star / badge counter ticks up. If it’s "needs another go," they see specific feedback — "Looks like the corner of the bed isn’t quite tucked. Almost there!" — never a generic "no."',
      },
      {
        type: 'h3',
        text: 'On the parent’s side',
      },
      {
        type: 'p',
        text: 'You see today’s family pulse on the dashboard — how many submissions came in today, which ones are waiting on you, who’s had a strong week and who’s wobbled. The dashboard surfaces the most actionable thing first: kids with submissions awaiting your review.',
      },
      {
        type: 'p',
        text: 'Click any submission to see the photo, the AI’s verdict and feedback, and your override options. You can also drill into any kid’s 13-week progress heatmap, edit chores, generate a kid-device login code, or change family settings.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'parent-override',
    eyebrow: 'The parent override',
    title: 'AI assists. You decide.',
    blocks: [
      {
        type: 'p',
        text: 'No AI gets every chore right, and even when it does, there are days when "perfect" is the wrong target. Maybe your kid had a hard morning. Maybe they did 80% of the work and the rest is on you to finish. Maybe the AI flagged something that isn’t actually a problem in your home. The parent override exists to keep you in charge of every final call — without making the conversation with your kid harder.',
      },
      {
        type: 'p',
        text: 'When you override a submission, you pick a reason. The reason becomes a short, kind message your kid sees in their app. The four reasons were written by a licensed therapist and they are the only options for a reason:',
      },
      {
        type: 'callout',
        tone: 'warm',
        eyebrow: 'The four override reasons',
        title: 'Exactly what your kid will see.',
        body: 'Each reason is one tap. The kid sees the message in their feed, not the raw AI verdict.',
        lines: [
          '"Good enough for today." — when the result isn’t perfect but the day called for grace.',
          '"You worked SO hard." — when the effort mattered more than the outcome.',
          '"I’ll help with the rest. We’re a team." — when finishing is on you, and that’s okay.',
          '"Your grown-up wants you to try once more. You’ve got this." — when one more pass would land it.',
        ],
      },
      {
        type: 'p',
        text: 'You can also override an AI-approved submission to ask for another go (rare but useful — e.g., the AI was generous about a corner of the room), or clear your own override if you change your mind. Every decision is recorded so you can see your pattern over time.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'rewards',
    eyebrow: 'Rewards',
    title: 'Encouragement that doesn’t become leverage.',
    blocks: [
      {
        type: 'p',
        text: 'Rewards in Home Hero are designed to celebrate effort, not to weaponize compliance. Choose a style in Family Settings that fits your home — and turn them off entirely if you’d rather not have a counter at all.',
      },
      {
        type: 'definitions',
        items: [
          {
            term: 'Hops 🐇',
            body: 'A bunny-themed counter. Each approved chore is a "hop." Hops accumulate over time and unlock badges at milestones. Best for younger kids (ages 5–9).',
          },
          {
            term: 'Stars ⭐',
            body: 'Classic stars. Same milestone-and-badge structure as hops, slightly more grown-up feel. Best for kids 8–13.',
          },
          {
            term: 'Badges 🏅',
            body: 'Only the milestones — no running counter. Best for older kids who feel patronized by daily tallies.',
          },
          {
            term: 'Off',
            body: 'No counter, no badges. Kids just see "Done today!" and the parent override message. Recommended if rewards have backfired in your home before.',
          },
        ],
      },
      {
        type: 'h3',
        text: 'Reward weights',
      },
      {
        type: 'p',
        text: 'Not every chore is created equal. Cleaning the bathroom counter takes more effort than feeding the dog, and the reward should reflect that. When you add or edit a chore, you can set a reward weight from 1 to 5. The kid’s counter sums weighted submissions, not raw counts — so 5 quick chores worth 1 each give the same hop count as 1 big chore worth 5.',
      },
      {
        type: 'h3',
        text: 'Optional chores',
      },
      {
        type: 'p',
        text: 'Mark any chore as optional and it shows up in a separate "extras" section on the kid’s home screen. Extras are opt-in, count for rewards if completed, and never block the kid’s "you’re done for today" message. This is the right place for the "wash the car" or "rake the leaves" kinds of jobs that should feel like a bonus, not a baseline.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'progress',
    eyebrow: 'Progress and coaching',
    title: 'See the pattern, not just the day.',
    blocks: [
      {
        type: 'h3',
        text: 'Daily family pulse',
      },
      {
        type: 'p',
        text: 'At the top of your dashboard, a single-sentence pulse summarizes today: how many submissions, who finished, who’s still wobbling, whose extras are stacking up. The pulse is calibrated to encourage you — it never reads as "Alice is behind." It reads as "Alice has one chore left and you’ve approved her last three."',
      },
      {
        type: 'h3',
        text: 'Per-kid 13-week heatmap',
      },
      {
        type: 'p',
        text: 'Click any kid’s name in the dashboard to see their last 13 weeks of activity as a GitHub-style heatmap — dense, dark squares for days they finished everything; lighter or empty for days they didn’t. This is the view to bring to a therapy session or a kitchen-table conversation. It’s not a report card. It’s a pattern.',
      },
      {
        type: 'h3',
        text: 'Coaching articles',
      },
      {
        type: 'p',
        text: 'Inside the app you’ll find five short articles written by our founding therapist, organized by age bucket — ages 5–7, 8–10, 11–13, 14+. They’re built to be read on a phone in two minutes, while you’re waiting for coffee. Topics include "Why one bedroom is the right starting point," "How to actually say ‘good enough for today,’" and "What to do when your kid stops submitting." Articles are linked contextually from the dashboard when they match what you’re experiencing this week.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'two-surfaces',
    eyebrow: 'Web and iOS',
    title: 'Two surfaces, one family.',
    blocks: [
      {
        type: 'p',
        text: 'Home Hero ships as one product across two surfaces — the web app (for sitting at a desk and setting things up) and the iOS app (for catching the day on the go). Same data, same family, different shape.',
      },
      {
        type: 'h3',
        text: 'Web — the full dashboard',
      },
      {
        type: 'p',
        text: 'The web app is where you set the family up, add and edit kids and chores, configure rewards, change settings, and read articles. It opens to the full dashboard with everything visible at once. Built for clarity and configuration.',
      },
      {
        type: 'h3',
        text: 'iOS for parents — the review queue',
      },
      {
        type: 'p',
        text: 'When you open the iOS app as a parent, you go straight to a single-card review queue: one submission at a time, photo full-bleed, with one-tap approve / one-tap encouragement-first override reasons right under your thumb. Built for being on the train, in line at school pickup, between meetings. The full dashboard is still one tap away.',
      },
      {
        type: 'h3',
        text: 'iOS for kids — their own login',
      },
      {
        type: 'p',
        text: 'Kids can also install Home Hero on their own iPhone or iPad. From your dashboard, you generate a join code for them — a five-letter, dash, five-letter code that expires in 24 hours. On their device, they tap "I’m a kid" on the landing page, enter the code, and they’re signed into a kid-flavored version of the app: bunny mascot, rounded text, bigger buttons, no admin controls. From then on, they can submit photos directly from their own device.',
      },
      {
        type: 'callout',
        tone: 'info',
        eyebrow: 'A note on the kid surface',
        body: 'The kid app uses an anonymous Supabase session linked to their family member record — they never set a password, never give us an email, and can be reset by the parent at any time by generating a new join code. The kid surface is deliberately playful (mascot, soft colors) and deliberately limited (no settings, no override visibility, no access to other kids’ data).',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'privacy',
    eyebrow: 'Privacy',
    title: 'What we collect and what we don’t.',
    blocks: [
      {
        type: 'p',
        text: 'Home Hero collects only what the app needs to run for your family. Specifically:',
      },
      {
        type: 'bullets',
        items: [
          'Your parent email and password (the password is hashed; we never see it in plain text).',
          'Each child’s display name and age. We do not collect last names, addresses, schools, or birthdates.',
          'Photos kids submit. These live in private storage buckets readable only by your family. We never serve them publicly and they are not used to train any model.',
          'AI verdicts and feedback from OpenAI for the photo a kid submitted. The text feedback is stored alongside the submission so you and your kid can see what the AI said.',
          'Your decisions — approvals, overrides, override reasons. These are visible only to you and (when surfaced to the kid) to that specific kid.',
        ],
      },
      {
        type: 'p',
        text: 'We do not sell data, we do not advertise to anyone, and the kid surface never shows ads, third-party links, or any path off the app. Full details — including how to request a data export or deletion — are in the Privacy Policy at /privacy.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'getting-help',
    eyebrow: 'Getting help',
    title: 'How to reach a human.',
    blocks: [
      {
        type: 'p',
        text: 'During the v0 pilot, every family gets a direct line to the team. Email info@homehero.co with any question, bug report, feature idea, or "this didn’t go the way I expected" moment. We read every email and reply.',
      },
      {
        type: 'p',
        text: 'Founding families also get a 30-minute one-to-one session with our founding therapist (LMFT) included in their pilot. We can credibly only offer this once and only for the first 100 families — so if you’re reading this and haven’t booked yours, email us to schedule.',
      },
      {
        type: 'callout',
        tone: 'accent',
        eyebrow: 'In a hurry?',
        body: 'For the fastest answer, email info@homehero.co with "Home Hero" in the subject. We typically reply within one business day.',
      },
    ],
  },
];
