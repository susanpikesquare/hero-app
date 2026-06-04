# Home Hero — Erica's Locked Decisions

*A canonical record of decisions Erica has made — first the strategic
moves from the June 3, 2026 working session, then the in-workbook
answers she has filled in. This file is the answer key. When the build
needs to know "did Erica decide X yet?", look here.*

**Last updated:** 2026-06-03 (working session)
**Source documents:**
- `Home Hero Clinical Decision Workbook (Fillable) v0.3` (in
  `~/Downloads`, Erica's working copy)
- `Home Hero MVP PRD v0.3.1` (the engineering spec)
- Susan's notes from the June 3 working session (transcribed below)
- Cross-references: `docs/product-vision.md`, `docs/product-philosophy.md`

**Status legend:** ✅ Decided · 🟡 In progress · ⬜ Open

---

## Part 1 — Locked positioning (June 3 working session)

These are the strategic moves Erica made today. They override anything
in earlier docs that contradicts them.

### ✅ Home Hero is *not* clinical, not therapy

*"This is not 'clinical.' Nothing should reference this as therapy or
clinical advice or expertise."*

**Build implications:**
- No mention of "clinical," "therapeutic," "therapy," "treatment," or
  Erica's credentials in any user-facing surface (landing page, signup,
  app copy, AI feedback, articles, /guide).
- Erica's name + LMFT can appear as a *consultant credit* in About /
  Privacy / footer, but not as the product's expert authority.
- The product *refers* people to professional support when warranted
  (pediatrician, mental-health provider); it does not provide it.
- `docs/product-philosophy.md` already updated to reflect this. Audit
  `src/app/guide.tsx`, `src/app/index.tsx` marketing copy, and
  `src/lib/articles.ts` for any remaining clinical framing.

### ✅ Home Hero is *not* an ADHD-specific app

The product surface is universal. Neurodivergence becomes optional,
parent-provided *context* (PRD §8A), never a verdict the child sees.

**Build implications:**
- Already shipped: the universal kid surface
- Already shipped: per-kid `kid_mode` (auto / kid / teen / peer)
- **To ship:** the `neurodivergence_context` field on `family_members`
  (`not_specified` / `neurotypical` / `neurodivergent`). PRD §8A.
- **To revise:** marketing copy on `/`, the `/guide` page, the
  walkthrough doc, and the AI prompt — strip the ADHD-primary framing
  wherever it appears.

### ✅ The keywords: Harmony · Peace · Joy

Every feature tested against: does this move the family toward at
least one of those? If no, don't build it.

### ✅ The Hilio Plow problem (Erica's term)

Helicopter parent + snowplow parent. *"We are so afraid of our kids
failing we are setting them up to fail."* Home Hero exists so kids can
succeed AND fail in the safety of home — by lowering parental stress
enough that home is emotionally safe again.

**This is the deepest "why" of the product.** Surface it in:
- The Step 0 / Welcome onboarding (see below)
- The pre-signup self-assessment (see below)
- The future "About" page when we build it

### ✅ Performative parenting vs. presence

Parents are *doing things* with their kids but not *being a family*.
Home Hero takes the daily managing so the parent can drop reaction
mode and be present.

**Every screen passes this test:** does this give the parent space, or
take it?

### ✅ AI's role: an unbiased resource

*"AI won't hit limits but people do."*

The AI's job is to carry the parts of the parental load that a
nervous-system can't carry indefinitely: standard-keeping, reminders,
specific encouragement-first feedback. **The AI's calm is the
product.**

### ✅ Less is more (especially on the kid surface)

A picture of "make your bed" with no more than 3 short bullets.
Kid surface stays ruthlessly minimal.

**Build implications:**
- Already shipped: 3-tip cap on coaching_tips, single-CTA tile, status
  badge only when relevant.
- **Guard against drift:** any future kid-surface feature has to pass
  the 3-bullet test.

### ✅ Multi-household support is MVP (NOT Beta)

Erica explicitly: *"Will need to support multiple households to support
consistency for kids — creates a level playing ground for parents."*

This is for separated parents, blended families, shared custody. One
kid, two homes, same standard.

**Build implications:**
- This is a meaningful refactor: a `family_members` row currently
  belongs to one `families` row. We need a join table or a
  household-membership concept that allows a kid to be a principal in
  multiple households.
- Likely shape: `Kid` becomes top-level; `HouseholdMembership(kid_id,
  household_id, parent_id, role)` joins kids to households. Standards
  travel with the kid; households add their own optional overrides.
- Per-household reward modes are fine; the kid sees their *combined*
  view across households.

### ✅ Notifications, with built-in nudge awareness

Already noted in `product-vision.md` §4¾. Recapping for the lock log:

1. **Kid reminders:** morning + afternoon (when kid is home from
   school). Local notifications in MVP.
2. **Parent celebrations:** parent notified when kid completes a
   task. The notification carries the win, not the checkbox.
3. **Parent gentle nudge:** a button to send a soft kid-voice reminder
   instead of an in-person nag.
4. **AI metacognition on nudges (Erica's idea):** *"AI says hey you
   nudged 3 times today — consider an alternative."* A parent
   coaching prompt when nudges exceed a threshold.

### ✅ Days-until-launch — reframed (NOT a daily ticker)

Original concern (which Erica shared): a daily countdown becomes a
pressure machine.

New frame: not urgency, but *presence vs performative*. *"The app
creates space mentally and physically for the parent to get out of
reaction management mode to the let-me-just-be-with-you mode."*

**Surfaces (planned):** one-time onboarding moment, per-age-band
reframe at 16. **Not** a daily counter.

### ✅ Pre-signup self-assessment

A brief assessment before signup that asks:
- *Am I experiencing these things?* (frustration, exhaustion,
  distance from the people you love most)
- *Do I want these things?* (harmony, peace, joy, with specific
  outcomes)

**Purpose:** qualify the audience + reframe the parent's arrival from
consumer to participant.

**Open:** does the assessment gate signup, or is it purely a mirror?
Susan's instinct (in `product-vision.md` §4¾): mirror, not gate.

### ✅ Step 0 — Welcome / Arrival before setup

Before the parent adds a kid, before they pick a chore, they *arrive*.
A short welcome moment that:
- Possibly includes an educational recording
- Names the parent's actual feeling: *"Endlessly frustrated,
  exhausted, and distanced from those you love most."* — Erica's
  verbatim copy line.
- Frames what comes next: the app is going to take some of this load.

**Build implication:** new `/onboarding` or `/welcome` route, runs once
before the dashboard. Skippable but recommended.

### ✅ Weekly snapshot for overwhelm + over-scheduling

The future state: help families see the *total weekly load* across
kids + activities + tasks. Flag when a kid's week exceeds an
age-appropriate ceiling (soft warning per Workbook Q3.3).

**Phase:** Beta (post-MVP). MVP ships the data; the visualization
layer comes after.

### ✅ Recommend external support when struggling

If the app detects (or the parent self-reports) that the family is
genuinely struggling beyond what the product addresses, gently
surface a path to a pediatrician or mental-health provider.

**Build implication:** a "find help" / "talk to someone" surface,
plus a list of trusted referral organizations (see Content Needs
below).

### ✅ Explicit scope statement: this is not a parenting curriculum

*"This is not a parenting app for parents to learn how to parent
their ADHD child. This is just focused on building executive
function and reducing inter-familial conflict on the day to day."*

**Build implication:** don't market the product as a parenting
education tool. Marketing copy emphasizes the *daily relief*, not
*"learn to be a better parent."* The product is a co-pilot, not a
teacher.

### ⬜ Content needs (Erica → Susan)

Erica needs to provide a list of:
- Trusted sources to cite for developmental task guidance (per
  Workbook Q3.1 — published expert sources)
- Doctors / organizations to refer to (per the "recommend external
  support" above)

**Susan's TODO:** ask Erica for this list, with specific
recommendations (CDC, AAP, Montessori age guidelines as starter
candidates).

---

## Part 2 — Locked decisions from the Clinical Decision Workbook

Erica's verbatim answers, with build implications. Each one
graduates from "open" to "decided" in the workbook decision log.

### ✅ Q1.1 — What does parent success look like at weeks 1 + 4?

> *"Easy and intuitive experience, impactful and empowering, end of
> week two recurring growth. Tasks are getting done, expectations of
> their child are being met."*

**Build implications:**
- Onboarding is judged by *time-to-first-completed-task* and
  *time-to-feeling-empowered.* Instrument both.
- Week-2 recurring-growth is the activation moment. Build the system
  so that the week-1 → week-2 retention curve is visible to us.
- Success metric for week 1: at least one completed task with
  parent-given recognition. For week 4: pattern of daily completions
  without parent nagging.

### ✅ Q1.2 — Minimum required parent effort

> *"They need their children's age, know if their child is typical or
> neurodivergent or if they have concerns or have suspicions or know
> what the definition of these things mean. They don't need to know
> the specific chores a kid needs to do. For MVP we provide the
> template per age group."*

**Build implications:**
- **REQUIRED FOR MVP:** templated task suggestions per age group.
  Parent should not need to think about *what* to assign.
- Setup flow only asks: kids' names + ages + neurodivergence context
  (optional). That is the minimum.
- Hand the parent a pre-filled set of tasks they can edit or accept.
  See PRD §9.5 (library of starter tasks).

### ✅ Q1.3 — Early signals the app is reducing load

> *"Indicators that things are getting done — the parents approval in
> app that the task was done successfully. Lack of success would be
> an excessive number of reminders."*

**Build implications:**
- Top-line success metric: **% of completed tasks with parent
  approval**, week over week.
- Top-line failure metric: **reminders / completion ratio**. If
  reminders climb relative to completions, we're failing.
- Both go in the analytics event taxonomy (PRD §3) and the parent
  dashboard's weekly progress zone (PRD §10A Zone 3).

### ✅ Q2.1 — First-week win

> *"Tasks are getting done. There was a reduction in conflict /
> arguing. At least one task where the child understands the
> expectation clearly. Improved mood in both parent and child."*

**Build implications:**
- First-week success criteria (instrumented):
  1. ≥1 completed task per kid
  2. Self-reported conflict reduction (single check-in question at
     end of week 1, per PRD's "conflict-reduction measurement" gap)
  3. ≥1 task where the kid clearly understood the standard (signal:
     completed on first try, AI passed without coaching)
  4. Self-reported mood improvement (single Likert question)
- The end-of-week-1 check-in is itself a feature to build (~1 day).

### ✅ Q2.2 — Family-system setup, not one-kid setup

> *"If there are multiple kids in the family, they have to stand it
> up for everyone — it's a family operating system — they need
> family buy-in."*

**Build implications:**
- Setup flow scopes ALL kids upfront, not one at a time. The parent
  finishes onboarding only when every kid has a profile.
- Reframe onboarding copy: *"Let's set up your family operating
  system."* (Not: *"Let's add your first kid."*)
- This contradicts a "start small, add one kid first" instinct.
  Honor Erica's call: the product only works when the whole family
  participates.

### ✅ Q2.3 — Abandonment risk

> *"Another thing to manage, adding work, not providing measurable
> value — if there isn't a non-tangible difference for the parent or
> child (emotion, mood, relational quality) it could lead to
> immediate abandonment."*

**Build implications:**
- The Step 0 / Welcome screen exists specifically to inoculate
  against this — frame the app as the relief, not the work.
- Aggressive minimum-required-effort discipline (see Q1.2): the
  parent shouldn't have to *do* anything they didn't already need
  to do; the app should *carry* what they were carrying.
- End-of-week-1 + end-of-week-4 check-ins surface the felt
  difference. If a parent reports no felt difference at week 4, we
  intervene (gentle nudge, optional 1:1 with the founding-100
  therapist, etc.).

### ✅ Q3.1 — Task source: published research, NOT Erica's clinical authority

> *"Tasks should be generated based on public sources that state
> child-development stages and capabilities. This won't be defined
> by Erica — this is not proprietary or professional advice, this
> is based on published best practices from industry experts."*

**Critical implication:** Erica explicitly does NOT want her name on
the chore guidance. The starter task templates must be sourced from
published developmental expertise (CDC, AAP, Montessori-aligned age
guidance, etc.) and the in-app surface must cite the source.

**Build implications:**
- `src/lib/chore-suggestions.ts` needs a `source` field per
  suggestion (string citation).
- Setup screen / age guidance card shows the citation in small
  print: *"Sourced from CDC childhood development guidelines"* or
  similar.
- Updated marketing positioning: we do NOT say *"chore suggestions
  by therapist Erica Hospes, LMFT."* We say: *"Drawn from published
  developmental research, reviewed for emotional safety by Erica
  Hospes, LMFT."* The review-for-safety is what she's signing off
  on; the chore content is not her professional output.

### ✅ Q3.2 — Task source: both library + parent-authored, BOTH MVP

> *"Both for MVP — the priority is to reduce the burden for the
> parent. Needs to solve for two scenarios:*
> 1. *I know what I want my kids to do — they just don't listen or
>    get it done*
> 2. *I want my kids to be responsible, accountable, and have things
>    to do to contribute to the family and home. I need a
>    recommended list."*

**Build implications:**
- MVP ships:
  - A library of ~10 starter task templates per age band, drawn
    from published sources (per Q3.1)
  - A "create your own" flow (already shipped)
- The library is the *default path* for new parents. Custom is the
  power-user path.

### ✅ Q3.3 — Soft warnings on task overload, NOT hard stops

> *"Should cite or reference published resources for appropriate
> task loads. Built in warnings when exceeding what is appropriate
> for age groups but not a hard stop."*

**Build implications:**
- When a kid's daily/weekly task count exceeds an age-appropriate
  ceiling, show a soft inline warning: *"That's a lot for a
  9-year-old — most published guidance suggests 3–5 daily tasks at
  this age. Cite: \[source\]."*
- The parent can override and proceed. No blocking. The product is
  a co-pilot, not a gatekeeper.

---

## Part 3 — Still open in the Workbook

These are the questions Erica has NOT answered yet. Tomorrow's
working session (or whenever the next clinical session runs) should
target these in priority order. Most of them block the AI build.

| # | Question | Phase | Blocks |
|---|---|---|---|
| Q4.1 | Age-keyed parent role model (manager → consultant) | Beta | Parent-side voice articles |
| Q4.3 | Shared household tasks: MVP or Beta | Beta | Shared-task data model |
| Q5.1 | Which support dimensions matter, what's defaulted vs adjustable | MVP | `SupportSettings` shape |
| Q5.2 | Parent-set support intensity vs structured questions | MVP | Setup flow design |
| Q5.3 | Auto-adjust support: MVP or Beta | Beta | Adaptivity engine scope |
| Q5.4 | Neurodivergence-context prompt wording | MVP | Setup copy |
| Q5.5 | Per-context support defaults + behavior | MVP | Default seeding rules |
| Q5.6 | How to keep tailoring strong for parent + invisible to kid | MVP | Non-leak rule |
| Q6.1 | Number of age bands for MVP | MVP | Kid surface count + content |
| Q6.2 | Youngest-band scope (does 4-5 ship in MVP?) | MVP | First-launch scope |
| Q6.3 | Teen voice + mascot retirement | Beta | Brand split |
| Q7.1 | AI pass / coach / route thresholds + partial completion | MVP | Core AI loop |
| Q7.2 | Which moments must reach a human | MVP | Review routing |
| Q7.3 | Praise specificity + retry limits | MVP | AI guardrails |
| Q8.1 | Standalone vs in-context coaching | MVP | Coaching surface scope |
| Q8.2 | Coaching example authorship + count | MVP | Content pipeline |
| Q9.1 | Hard never-rules for AI output | MVP | Guardrail layer |
| Q9.2 | Distress/shutdown handling: MVP or Beta | Beta | Regulation flow |
| Q9.3 | Photo consent + handling framing | MVP | Consent copy + privacy policy |
| Q10.1–3 | Reward model + streak handling | Beta | Reward UX |
| Q11.1–7 | Household Standard rules | MVP | Create Task validation |
| Q12.1–5 | Independence progression / support fading | Beta | Adaptivity engine |

**Priority for the next clinical session:**
1. Q5.1, Q5.2, Q5.4, Q5.5, Q5.6 (adaptive support — MVP gate)
2. Q6.1, Q6.2 (age band count — MVP gate)
3. Q7.1, Q7.2, Q7.3 (AI thresholds — MVP gate)
4. Q9.1, Q9.3 (guardrails + photo consent — MVP gate)
5. Q11.1–7 (Household Standards — MVP gate)

---

## Part 4 — What this means for the existing build

Concrete refactors implied by Parts 1 + 2 above.

### Refactors needed (in priority order)

1. **`neurodivergence_context` field on `family_members`** (PRD §8A).
   Migration + setup-form input + per-context default seeding.
2. **Multi-household model** — Kid becomes top-level, joined to
   Households via membership rows. Standards travel with the Kid.
3. **Marketing & onboarding copy audit** — strip clinical /
   ADHD-primary framing from: landing page, `/guide`, AI prompt,
   articles, walkthrough doc, Erica meeting prompt template.
4. **Step 0 / Welcome route** — new `/welcome` or `/onboarding`,
   one-time, with Erica's verbatim feeling-line.
5. **Pre-signup self-assessment** — pre-`/signup` short questionnaire
   (mirror, not gate).
6. **Starter task library with citations** (PRD §9.5, Q3.1+Q3.2).
   `chore-suggestions.ts` gains a `source` field per suggestion.
7. **Soft task-load warnings** (Q3.3) — inline UI warning when a
   kid's day/week exceeds age guidance.
8. **Notifications system** — local notifications + parent
   nudge-count metacognition.
9. **Family-system setup, not one-kid-at-a-time** (Q2.2) — onboarding
   doesn't complete until every kid is added.
10. **End-of-week-1 check-in** (Q2.1) — single conflict-reduction
    Likert question.

### What we keep as-is

- The "Parent says X, kid hears Y" coaching surface (already shipped)
- The per-kid `kid_mode` (auto / kid / teen / peer) — though it
  becomes one of the five PRD §8 dimensions in the cleaner model
- The override flow with Erica's 4 reasons
- The reference-photo standard + coaching tips on chores

### What we phase OUT or revise

- ADHD-specific marketing on the landing page → reframe to universal
- "Therapist-built" / "Clinical-with-warmth" language in the product
  surface → reframe to "framework developed with Erica Hospes, LMFT,
  consultant"
- Any AI prompt language that claims clinical authority → reframe to
  "encouragement-first feedback"

---

## Susan's TODO this week (June 3–10)

- [ ] Pull this doc into PR with the updated `product-vision.md` +
      `product-philosophy.md`
- [ ] Ask Erica for the list of trusted sources / orgs to cite
      (Q3.1, Q9.3 referral list)
- [ ] Schedule the next clinical session targeting the MVP-gate
      questions above
- [ ] Engineering: lock the 8 engineering-only defaults from the PRD
      Top-10 (day boundary, timezone, child session lifetime,
      parent PIN, TaskInstance idempotency, edit-vs-instance,
      kid-initiated metric, AI failure fallback)
- [ ] Marketing audit: strip clinical + ADHD-primary framing from
      the landing page, `/guide`, AI prompt, articles, walkthrough
- [ ] Start the data-model refactors: `neurodivergence_context`
      first (smallest, unblocks setup), multi-household second
      (largest, but Erica explicitly required it for MVP)

---

*This doc supersedes any earlier note that contradicts it. When
something here conflicts with `product-vision.md` or
`product-philosophy.md`, those docs need updating to match this one
— this is the answer key.*
