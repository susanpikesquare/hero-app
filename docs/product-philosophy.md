# Home Hero — Product Philosophy

This document is the north-star reference for what Home Hero is and isn't. It exists so anyone working on the product — engineer, designer, therapist, copywriter, AI prompt author — has a single source of truth for the principles that should land in every screen, every line of copy, every AI response.

This is **not** marketing copy. It's the framework that informs all the marketing copy, all the UI decisions, all the AI training data, and the entire product roadmap.

Authored with Erica Hospes, LMFT (founding therapist consultant), May 2026.

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

## The differentiator: clinical authorship

A random tech founder can build task software. They cannot easily build:

- Trauma-informed feedback loops
- Developmental scaffolding
- Parent-child relational repair architecture
- Emotionally intelligent accountability systems
- Attachment-aware UX

That's the moat. Home Hero is therapist-built — clinical voice in every screen, not just a "wellness" wrapper around a productivity tool.

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

Home Hero is most obviously for **families with ADHD kids ages 5–16**, but the design principles serve a much wider population. Markets the product naturally fits:

- ADHD / executive functioning families (primary)
- Neurodivergent households (autism, anxiety, sensory-sensitive)
- Blended families
- Divorced co-parenting homes (one app, both households)
- High-achievement overwhelmed homes
- Therapy practices (clinicians using it with clients)
- Occupational therapists
- Parenting coaches
- Schools
- Residential programs
- Foster / adoptive families

Anything sensory-aware, nervous-system-aware, or executive-function-aware is a fit.

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

### Layer 2 — ADHD / executive-function adaptation

Every task is adjustable for:

- Task initiation
- Working memory
- Time blindness
- Sensory overwhelm
- Distractibility
- Frustration tolerance
- Sequencing
- Follow-through

Expand to other neurotypes (autism-sensitive, anxiety-sensitive) as the schema supports it.

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
- **Neurotype**: typical, ADHD, autism-sensitive, anxiety-sensitive
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

---

## Final rules of thumb

1. If a feature requires the parent to nag, we built it wrong.
2. If a feature could make the kid feel ashamed, we built it wrong.
3. If the AI ever sounds like a disappointed teacher, the prompt is wrong.
4. If the product would still work for a family with no ADHD diagnosis, we're on track.
5. The kid is trying. Always.

---

*Last updated: May 2026. Maintained jointly by engineering and clinical (Erica Hospes, LMFT).*
