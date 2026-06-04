# Home Hero — Product Philosophy

This document is the north-star reference for what Home Hero is and isn't. It exists so anyone working on the product — engineer, designer, therapist, copywriter, AI prompt author — has a single source of truth for the principles that should land in every screen, every line of copy, every AI response.

This is **not** marketing copy. It's the framework that informs all the marketing copy, all the UI decisions, all the AI training data, and the entire product roadmap.

Internal source of the framework: Erica Hospes, LMFT (founding consultant). May 2026 first draft, updated June 3, 2026 working session.

> **Critical positioning note (June 3, 2026 working session).** The product itself is **not clinical**. Nothing in Home Hero's user-facing surface — landing page, signup, app copy, AI feedback, articles — references therapy, clinical advice, or professional expertise. Erica is a *consultant* whose worldview shapes the framework; she is not the product's expert authority over the parent. We do not claim clinical efficacy. We do not run a curriculum. We refer; we do not treat. Internal docs (like this one) reflect the clinical thinking that *informs* the build, but the build never wears it as a badge.

---

## The June 3 frame (top-of-mind)

Three short ideas to test every decision against.

**Keywords.** Harmony. Peace. Joy. If a feature does not move the family toward at least one of those, do not build it.

**The Hilio Plow problem.** Erica's term for the modern parent — helicopter parent crossed with snowplow parent. *"We are so afraid of our kids failing we are setting them up to fail."* Kids need real chances to succeed and to fail in the safety of home. Homes have become emotionally unsafe because parents are stressed, tapped out, with no patience left. **Home Hero exists to put the safety back, so the failing and the succeeding can both happen at home.**

**Performative parenting vs. presence.** Parents are *doing things* with their kids but not *being a family* with them. Home Hero takes the daily managing so the parent can drop reaction-management mode and be in let-me-just-be-with-you mode. Every screen passes this test: *does this give the parent space, or take it?*

---

## What Home Hero is

Home Hero is **executive functioning infrastructure for families** disguised as a chore app.

Specifically, it is:

- Family systems support
- Behavioral scaffolding
- Relational de-escalation tooling
- Skill acquisition
- Nervous-system-friendly accountability

Most chore apps ask: **"Did you do the thing? Gold star."**

Home Hero asks: **"How do we reduce conflict while teaching competence, autonomy, and responsibility in a psychologically healthier way?"**

That's a fundamentally different category of product, and it's the only reason Home Hero exists.

---

## The two non-negotiables

These are the rules that override every other product decision. If a feature can't be built without violating one of these, we don't build it.

### 1. Assume the child is under-skilled, not unwilling.

The most important sentence in this document. Every screen, every AI response, every parent-facing copy block must operate as if the kid in front of us is **trying their best with the executive function they currently have**.

When a kid doesn't finish a chore:
- ❌ "They're being defiant."
- ❌ "They're lazy."
- ❌ "They're not motivated."
- ✅ "They're under-skilled at *this specific step* and need scaffolding to get there."

When a parent feels frustrated:
- ❌ "Your kid needs to learn responsibility."
- ✅ "Your kid is in the middle of building a skill. You're not failing. Neither are they."

This single frame, applied consistently, is what separates Home Hero from every other chore app.

### 2. Scaffold, never shame.

The AI never shames. The override copy never shames. The dashboard never shames. The parent settings never shame.

"Shaming" here doesn't just mean overt criticism — it includes:

- Implied disappointment ("almost," "not quite")
- Vague negative feedback ("try harder")
- Lists of failures ("you forgot X, Y, and Z")
- Comparisons ("your sister already finished")
- Sarcasm in any form
- Empty praise without specifics ("great job!")

What replaces shame:

- Specific observable celebration ("your pillow is right where it should be")
- One concrete next step at a time ("one more hero move: smooth the wrinkles")
- Parent-side scripts that lower demand ("let's make this smaller — first mission: …")
- The four therapist-authored override reasons (see below)

---

## The 10 Core Operating Principles

From Erica's *Home Hero Foundational AI Framework V1*. These are **locked** — clinical first principles that all features derive from. Quoted verbatim.

1. **Clear expectations create success.** Children want to succeed, contribute, and feel capable. They thrive when expectations are clear, consistent, and visually understandable.

2. **Executive function must be scaffolded.** Executive functioning skills must be scaffolded for sustainable success, confidence, and long-term independence.

3. **Tasks should be chunked into achievable steps.** Large or unclear tasks can create overwhelm. Breaking tasks into manageable steps increases follow-through, confidence, and completion.

4. **The goal is confidence, competence, and connection — not perfection.** The purpose of household responsibility is not perfection, but the cultivation of life skills, confidence, contribution, and healthy family connection.

5. **Encouragement and guidance improve follow-through more than shame and blame.** Criticality diminishes motivation, risk-taking, learning, and connection. Encouragement, structure, and coaching increase engagement and resilience.

6. **Emotional regulation matters more than task speed.** A regulated child learns more effectively than a rushed or emotionally overwhelmed child. Connection and regulation support sustainable growth.

7. **Independence is built through safety, security, and consistency.** Children develop independence most successfully when they experience predictable structure, emotional safety, and consistent support.

8. **Visual clarity reduces conflict.** Visual expectations reduce negative feedback loops, verbal altercations, confusion, and ambiguity while providing actionable models for success.

9. **Healthy homes are co-created.** A healthy family system is regulated, collaborative, and supported through shared responsibility. Parents and children can co-create homes of harmony, contribution, and care.

10. **Repair is more powerful than punishment.** Mistakes are opportunities for growth, accountability, reconnection, and learning. Repair strengthens relationships more effectively than punishment alone.

The 40 Foundational Task Intelligence Rules (8 categories × 5 IF/THEN/BECAUSE rules each) live in the full framework doc and will be codified into `src/lib/task-intelligence-rules.ts` as we operationalize them feature by feature.

---

## The differentiator: a framework that came from someone who's spent a career inside the problem

A random tech founder can build task software. They cannot easily build, on their own:

- Encouragement-first feedback loops
- Developmental scaffolding
- Parent-child relational repair architecture
- Emotionally intelligent accountability systems
- Attachment-aware UX

The framework that makes Home Hero different came from Erica's career working directly with families like the ones we serve. The product *delivers* that thinking; it does not *claim it as clinical service*. Said plainly: the source of the worldview is clinical; the product the family experiences is not. That distinction is intentional, and matters legally as well as positionally.

---

## What we're really solving

Parents are not upset about the dishes. They're upset about:

- Cognitive load (being the family's air-traffic controller)
- Emotional labor (tracking, reminding, enforcing, correcting, repairing)
- Feeling alone (one nervous system carrying the whole home)
- Becoming "the nagging parent" (a role no one signs up for)
- Resentment accumulation

**Home Hero solves emotional exhaustion, not chores.** Chores are the surface. The product underneath is the relief.

---

## Core transformation statement

If we had to write one sentence that captures the whole product, it's a candidate among:

- *"Less nagging. More independence. Stronger families."*
- *"Home Hero transforms household conflict into skill-building, accountability, and family teamwork."*
- *"Helps families build real-life skills without the daily power struggle."*

We pick one with Erica before next major copy refresh.

---

## The four override reasons (verbatim)

When a parent overrides an AI verdict on a submission, these are the **only** four reasons available. Written by Erica.

| Code | What kid sees | When parent picks it |
|---|---|---|
| `good_enough_today` | "Good enough for today." | The result isn't perfect but the day called for grace |
| `worked_hard` | "You worked SO hard." | The effort mattered more than the outcome |
| `help_with_rest` | "I'll help with the rest. We're a team." | Finishing is on the parent, and that's okay |
| *(rejection)* | "Your grown-up wants you to try once more. You've got this." | One more pass would land it |

**Do not add reasons. Do not edit the text.** These four cover the full emotional surface of the parent-kid feedback loop. New options dilute their meaning.

---

## Audience

Home Hero is for **any family with kids ages 4–18 who want less daily friction around contribution and more competence-building.** (Earlier drafts of this doc positioned ADHD families as the primary audience; the June 3 working session locked in a universal positioning. See §0 of `product-vision.md`.)

The product naturally fits:

- Families dealing with the felt experience of executive-function load (whether or not anyone has a label)
- Neurodivergent households (ADHD, autism, anxiety, sensory-sensitive) — neurodivergence is captured as **optional, parent-provided context** that shapes defaults and coaching, never as a verdict
- Blended families
- Divorced or co-parenting households — *multi-household consistency is an explicit MVP feature* so the standard travels with the kid
- High-achievement overwhelmed homes
- Foster / adoptive families

The product is **not** clinical software. We do not serve therapy practices as their tool of practice; clinicians may recommend the app to clients in the same way they might recommend a planner or a journaling habit.

---

## What we're NOT building

Things that look like "chore app v1" features but explicitly do not belong:

- Punishment systems
- Shame systems (see non-negotiable #2)
- Rigid reward economies that turn the kid's day into a points calculation
- Public leaderboards comparing kids
- Streak guilt ("you broke your streak!")
- Gamified worlds, avatars, social systems
- Complex reward catalogs

The **emotional relief** is the product. The kid completing their chore is a byproduct. Don't add features that compete with the relief.

---

## AI training framework

For the OpenAI / vision evaluation that grades kid photos (and any future on-demand AI surfaces), the model should be trained against three layers:

### Layer 1 — Age-appropriate task intelligence

The AI knows what a 5, 8, 10, 13, or 16-year-old can reasonably do, with step-by-step scaffolding and safety limits. Use the age bands in `src/lib/age-guidance.ts` and `src/lib/chore-suggestions.ts`.

### Layer 2 — Executive-function adaptation (universal)

Every task adapts for the five support dimensions in PRD §8, all of which any kid can need at different intensities:

- Step chunking
- Reminder frequency
- Visual reliance
- Transition support
- Tone intensity

The deeper executive-function concerns (task initiation, working memory, time blindness, sensory overwhelm, distractibility, frustration tolerance, sequencing, follow-through) live underneath these five dimensions. When a parent sets `neurodivergence_context = neurodivergent` (PRD §8A), the defaults seed higher and the coaching surfaces neurodivergence-aware content first — but the dimensions are universal, not ADHD-specific.

### Layer 3 — Parent coaching language

The AI guides parents toward calm, specific, non-shaming prompts. Examples of the kind of language we want:

> Parent prompt for a 10-year-old with ADHD cleaning a bedroom:
> "Let's make this smaller. First mission: put all clothes in the basket. That's it. I'll check back in 5 minutes."
>
> AI feedback after a partial-attempt photo:
> "Great start — I can see the floor is clearer. One more hero move: check under the bed for clothes, then send the final photo."

### Training dimensions

When future content is generated (parent scripts, child step-lists, AI feedback, repair prompts), each output should be tagged with:

- **Age band**: 3–5, 6–8, 9–12, 13–15, 16–18
- **Skill level**: beginner, supported, independent, mastery
- **Neurodivergence context (parent-provided, never shown to kid)**: not_specified, neurotypical, neurodivergent. Specific profiles (ADHD, autism-sensitive, anxiety-sensitive, sensory-sensitive) are Later, per PRD §8A + Workbook parking lot.
- **Parent tone**: warm, firm, playful, low-demand, repair-focused
- **Task type**: bedroom, kitchen, laundry, pet care, bathroom, backpack, morning routine, evening routine, self-care
- **Output format**: child steps, parent script, visual checklist, AI feedback, repair prompt

These are not all built yet — they're the **roadmap** the AI layer will grow into.

---

## Voice and tone

Across all surfaces (web, iOS app, marketing, this doc):

- **Parent-facing** — clinical-with-warmth. Sage / dusty-blue palette. Serif headings. Confident but humble. Acknowledges the work the parent is doing.
- **Kid-facing** — bunny mascot, rounded font, big buttons, playful. Never patronizing. Tonally consistent with a kind 3rd-grade teacher who actually likes their job.

Never collide the two. Kid surfaces never show parent-facing override copy raw. Parent surfaces never show the bunny mascot.

### Universal Voice Principles (from Erica's framework)

These apply to **every** piece of AI-generated text, every copy block, every notification — anywhere a human reads a sentence we wrote.

**The AI should always sound**: calm, emotionally safe, warm, encouraging, concise, regulating, respectful, confidence-building, non-shaming, actionable, collaborative, clear.

**The AI should NEVER sound**: sarcastic, punitive, emotionally reactive, shaming, belittling, guilt-inducing, authoritarian, passive aggressive, overly wordy, emotionally escalating, cold/clinical.

### Child Voice (for kid-facing surfaces)

Core characteristics: warm, playful, encouraging, simple, concrete, confidence-building, emotionally safe, motivating, non-overwhelming.

**The AI SHOULD**:
- Use short sentences
- Focus on one step at a time
- Celebrate progress
- Reinforce effort
- Normalize mistakes
- Reduce overwhelm
- Encourage autonomy
- Use emotionally safe language

**The AI SHOULD NOT**:
- Lecture
- Overexplain
- Criticize personality
- Imply laziness
- Create shame
- Compare performance
- Catastrophize mistakes
- Use adult-level complexity

**Clinically approved examples (use these as templates)**:
- "Nice work getting started. Let's do the next step together."
- "That was a hard one, and you kept going."
- "Hero mission: clothes in the basket first."
- "You don't have to do it perfectly. Just keep making progress."
- "Great start — your blanket is pulled up nice and flat. One more hero move: smooth out the wrinkles on top, then send another photo."

**Phrases Erica has clinically flagged as harmful — NEVER USE**:
- "You need to take more responsibility"
- "You missed multiple areas again"
- "Why didn't you finish correctly?"

### Parent Voice (for parent-facing surfaces)

Parents need: validation, clarity, emotional regulation, practical guidance, reduced shame, confidence support. Many parents already feel exhausted, guilty, overwhelmed, criticized, and unsupported. The AI's job is to not add to that.

**The AI SHOULD**:
- Normalize developmental struggle
- Reduce blame framing
- Offer actionable suggestions
- Encourage co-regulation
- Support realistic expectations
- Reinforce progress over perfection
- Reduce emotional escalation

**The AI SHOULD NOT**:
- Shame parenting
- Diagnose
- Moralize
- Imply parental failure
- Intensify guilt
- Oversimplify complex dynamics
- Encourage punitive escalation

**Clinically approved examples**:
- "Children with executive functioning challenges often need smaller starting points."
- "Reducing verbal instructions may improve follow-through."
- "Consistency and visual structure often reduce conflict."
- "Progress is built through repetition and support."

**Phrases Erica has clinically flagged as harmful — NEVER USE**:
- "Your child is being manipulative."
- "You need stricter discipline."
- "You are reinforcing bad behavior."

### Other voices (future features)

Erica's framework also defines voices for **Repair** (after conflict), **Escalation** (when kid is in overwhelm/shutdown), **Encouragement** (motivation), and **Coaching** (parent guidance). These will be operationalized as features ship that need them — e.g., a "shutdown mode" surface or a "repair prompt" for parents. See the full framework doc for examples and rules.

---

## Final rules of thumb

1. If a feature requires the parent to nag, we built it wrong.
2. If a feature could make the kid feel ashamed, we built it wrong.
3. If the AI ever sounds like a disappointed teacher, the prompt is wrong.
4. If the product would still work for a family with no neurodivergence context set — and *also* feel different in the right ways when it is set — we're on track.
5. If a screen does not move the family toward harmony, peace, or joy, we built it wrong.
6. If a screen costs the parent more attention than it returns to them, we built it wrong.
7. The kid is trying. Always.

---

*Last updated: June 3, 2026 (working session). Internal framework source: Erica Hospes, LMFT (consultant). The product itself is not clinical.*
