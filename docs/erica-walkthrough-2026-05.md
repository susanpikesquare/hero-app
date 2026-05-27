# Home Hero — Walk-through for Erica (May 2026)

Hi Erica,

This is a guided 30-ish-minute walk-through of everything that landed this week in Home Hero. The changes are heavily based on the *Foundational AI Framework V1* document you sent — your 10 Core Operating Principles, the Universal/Child Voice rules, the age bands, the clinically-flagged "never say" phrases.

I want your reaction to:
1. **Does the voice land?** Does the AI sound the way you intended in the framework?
2. **Does the kid surface feel emotionally safe?** Anything that makes you wince?
3. **What's missing that I'd want to add next?**

Feel free to skim, skip, or linger. No wrong way to do this.

---

## Before you start

You'll need both your phone AND a computer open. The flow involves switching between "parent" view (computer) and "kid" view (phone via TestFlight).

**On your phone**: Open TestFlight. You should have the latest **Home Hero Family** build (0.0.1, build 10 or higher). Tap to install if you haven't. If TestFlight isn't asking you to update, **close the app fully and re-open it twice** — this pulls the latest OTA updates.

**On your computer**: Open `https://hero-app-pied-three.vercel.app/` in a browser.

**Demo data**: I've seeded a family called **"Topping House"** with three kids — Alice (age 9), Sam (13), and Theo (9). Each has chores already set up and a few weeks of submission history. You can use this for the parent-side exploration. For kid-side, I'll have you create a new join code as we go.

---

## Part 1: As a parent setting up a NEW kid

This is where the new ADHD age-guidance and the framework's developmental matrix first show up.

### Step 1 — Sign in to the web app

1. Open `https://hero-app-pied-three.vercel.app/` on your computer
2. Sign in with the parent account I'll send you separately

You should land on the dashboard with Alice, Sam, and Theo's cards visible.

### Step 2 — Pretend you're adding a fourth kid

1. From the dashboard, find the "+ Add kid" button
2. Add a new kid — any name, **age 8** (pick this specifically so the framework's "6–8" band kicks in)
3. After saving, click into their settings → "Set up chores"

**This is the page I want you to react to.** You should see, in this order:
- A header introducing the new kid by name
- **A coaching article callout** ("Read: [article title]")
- **A new card titled "ADHD development · Ages 6–8"** — this is the developmental guidance card. It includes a frame paragraph, three sections (Social, Emotional, Cognitive), and a "What this means for chore-picking" callout at the bottom
- Then the suggested chores list

**Look for**:
- Does the guidance feel clinically true to you? Anything you'd rephrase?
- Does the chore-picking implication paragraph at the bottom land?
- Is the age-band labeling (6–8 instead of 7–9) showing correctly?

✏️ *Margin notes*: ____________

### Step 3 — Pick a few chores including a self-care one

While you're on this page:
1. Add a **photo chore** (e.g., "Make bed" or "Tidy bedroom floor")
2. Add a **self-care chore** (e.g., "Brush teeth (morning)" or "Shower") — these will be marked with `verification: 'checklist'` internally
3. Tap "Save"

**Look for**:
- Each suggested chore now comes with 3 pre-drafted **coaching tips** (the ADHD-friendly bullets like "Sheet flat first / Blanket pulled up / Pillow on top, smooth"). You don't see these in the picker UI, but they'll seed into the chore.
- Self-care chores are tagged as "no photo needed" in the blurb.

---

## Part 2: As a kid

Now switch to the phone. This is the surface most affected by the framework changes — the new chore tile with reference photo + tips + clearer CTA, and the new "Mark done" flow for self-care.

### Step 4 — Generate a kid join code and switch to the iPhone app

1. On the web (parent view), click on **Alice** → "Manage" → "Generate join code"
2. A 5-letter-dash-5-letter code appears. Copy it.
3. On your iPhone, open **Home Hero** from TestFlight
4. Tap **"I'm a kid"** on the chooser landing
5. Enter Alice's code → "Let's go!"
6. You should land on the kid home with **"Hi Alice 👋 / Today's to-dos"**

**Look for** (iOS chooser landing specifically):
- Did the simpler landing screen come up (logo + 3 buttons), or did the full marketing page render?

✏️ *Margin notes*: ____________

### Step 5 — The new kid chore tile

You're now looking at Alice's chore list. Each tile should have:
- 📷 **A reference photo thumbnail** on the left (a small image of what "done" looks like)
- The chore title
- **A "What 'done' looks like" callout** with 3 bullet tips written for ADHD kids
- A single clear CTA at the bottom: **"📸 Take a photo →"** or **"Mark done →"** depending on chore type
- (Possibly) a status badge: "Done today!" / "Waiting on your grown-up" / etc.

**Look for** (this is the BIG one for you):
- Was your "Can the model pic be right there on that task pane?" feedback honored?
- Do the coaching tips read in the Child Voice from your framework? Look at "Make bed":
  - "Sheet flat first"
  - "Blanket pulled up"
  - "Pillow on top, smooth"
- Does anything feel patronizing, overwhelming, or unclear?
- Does the kid surface feel emotionally safe?

✏️ *Margin notes*: ____________

### Step 6 — Submit a photo, see the new AI feedback

1. Tap a photo-chore tile (e.g., "Make bed")
2. Tap "📸 Take a photo →"
3. Pick any photo from your library — even a random one. The AI will evaluate it against the reference.
4. Submit
5. Wait ~10 seconds for the AI verdict
6. Tap the chore tile again — you should see either "Done today!" (if it passed) or "Your grown-up wants another go" (if it needs work) with a feedback message

**Switch to the parent view on your computer** and find the submission you just made:
- Dashboard → click into Alice → find the latest submission
- Read the AI feedback text

**Look for** (this is the OTHER big one):
- Does the feedback follow the "Great work — [specific] / Great start — [specific]. One more hero move: [next step]" shape from your framework?
- Is it specific to what the AI sees in the photo (not generic)?
- Does it sound encouragement-first?
- Does it sound disappointed or shame-y anywhere?
- Did the AI use any of the clinically-flagged forbidden phrases?
  - "You need to take more responsibility"
  - "You missed multiple areas again"
  - "Why didn't you finish correctly?"
  - "Try harder", "You forgot", "almost", "not quite"
  - Generic "great job"

✏️ *Margin notes*: ____________

### Step 7 — Try a self-care chore

Back on the phone as Alice:
1. Find a self-care chore tile (Brush teeth, Shower — whichever you added in Step 3 OR one Alice already has)
2. The CTA should say **"Mark done →"** not "Take a photo →"
3. Tap it
4. The chore should immediately mark as done — no camera, no AI, no waiting

**Look for**:
- The "no photo for self-care" approach honors your "would not take pics of the kids" point
- Status updates instantly
- Does the kid get any feedback message? (Currently no — they just see the green check. Worth a future addition?)

✏️ *Margin notes*: ____________

---

## Part 3: As the parent reviewing submissions

This is the override flow with your four therapist-authored reasons.

### Step 8 — Override a submission

1. On the parent view (computer), find the submission Alice just sent
2. The AI gave a verdict. **Override it.**
3. You'll see the four reasons exactly as you wrote them:
   - **"Good enough for today."**
   - **"You worked SO hard."**
   - **"I'll help with the rest. We're a team."**
   - For rejections (try Again): the kid sees *"Your grown-up wants you to try once more. You've got this."*
4. Pick any one — see the override applied

**On your phone**, as Alice:
- Refresh the kid home or wait a moment
- The chore tile should now show your override message verbatim in a soft callout

**Look for**:
- Are the four reasons still landing exactly as you wrote them?
- Anything to refine?
- Is the placement on the kid tile working — is the message visible and gentle?

✏️ *Margin notes*: ____________

---

## Part 4: The longer view

### Step 9 — The 13-week heatmap

1. On the parent dashboard, click into any kid (Alice, Sam, Theo)
2. Click "Progress" or scroll to the heatmap section
3. You should see a GitHub-style 13-week grid showing daily activity

**Look for**:
- Does seeing 13 weeks at once feel useful for a parent? Therapeutic?
- Would you use this in a session with a client?

### Step 10 — Read /guide

Visit `https://hero-app-pied-three.vercel.app/guide` — this is the new customer-facing product doc.

**Look for**:
- Does it accurately represent Home Hero to a prospective customer?
- Is anything missing?
- Anything that contradicts the framework?

---

## Bonus: Read `docs/product-philosophy.md`

If you want, here's the internal source of truth that I keep in sync with your framework:
`https://github.com/susanpikesquare/hero-app/blob/main/docs/product-philosophy.md`

It has the 10 Core Operating Principles + voice rules baked in verbatim. Engineering reads this before touching any feature. If you want to edit it directly via GitHub, you have access — Susan can show you how.

---

## What I most want feedback on

1. **The AI's actual feedback message** (Step 6) — did it sound the way you intended in the framework? If not, what would you change?
2. **The kid chore tile** (Step 5) — does it feel emotionally safe and ADHD-friendly?
3. **The age guidance card** (Step 2) — clinically accurate? Anything to rephrase?
4. **The four override reasons** (Step 8) — still right? Any to add?
5. **Anything that made you wince.** Even small things — wording, color, ordering.

You can reply to this doc, email me, or jump on a call. The framework is **incorporated, not finalized** — we'll keep iterating with you.

— Susan
