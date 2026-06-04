# Home Hero — Engineering Defaults

*Reference doc capturing the 8 engineering decisions from the PRD v0.3.1
"Top-10 Decisions Before Coding" list that are owned by Susan + a lead
engineer (not Erica / not clinical). Each decision is recorded as
**Decided** with the rationale + the file(s) it lives in. Per the PRD:
"Decisions 4 through 8 are engineering and can be locked by the founder
and a lead engineer this week."*

**Last updated:** 2026-06-04. Locked together with the Batch B build.

---

## 1. Day boundary and timezone

**Decided:** Day boundary at **local household midnight**. The household
runs in **the parent's local timezone** (captured from the device at
signup, persisted on `families.timezone`).

**Rationale:**
- Per PRD §12: "household timezone; day boundary at local midnight" is
  the recommended default and matches every other parent's mental
  model of "today."
- Multi-household kids (a future state) will use the timezone of the
  household whose surface they're using at the moment. Cross-household
  reconciliation is its own task (Batch C territory).

**Implementation status:** `families.timezone` does not yet exist as a
column — TBD migration. Until then, the client falls back to
`Intl.DateTimeFormat().resolvedOptions().timeZone` on every read, which
is correct for single-household v0 but won't survive multi-device.

**File(s):** `supabase/migrations/*_v0_household_timezone.sql` (TBD),
`src/lib/time.ts` (TBD helper).

---

## 2. Child session lifetime and revocation

**Decided:** Child sessions are **long-lived refreshable tokens** (no
forced re-auth for the kid). Revocation invalidates **server-side**
and is checked on every authenticated request via Supabase Auth's
built-in JWT revocation list.

**Rationale:**
- The kid on a linked device shouldn't be asked to "sign back in"
  every few days — that defeats the "reduced parental reminding" north
  star.
- Server-side revocation (via `auth.admin.signOut` from the parent's
  authenticated session) is the only safe path. A client-side flag
  would be trivially bypassed.

**Implementation status:** Tokens are issued through the existing
`generate_kid_join_code` RPC and are valid until the parent revokes
or rotates them. The revocation RPC is TBD.

**File(s):** `supabase/migrations/20260523225709_v0_kid_join_codes.sql`,
`supabase/migrations/*_v0_revoke_kid_session.sql` (TBD).

---

## 3. Parent PIN policy

**Decided:**
- **4–6 digits** (numeric only)
- **Rate-limited attempts:** 5 wrong attempts → 1-minute cooldown.
  After 10 cumulative wrong attempts within an hour → require
  password reauth.
- **Reset path:** via the parent's authenticated account — the parent
  signs in with their email + password and sets a new PIN.

**Rationale:**
- The parent PIN is the only boundary between Kid Mode and the parent
  app on a shared device. It needs to be strong enough to resist
  accidental kid-curiosity but not so strong that a real parent gets
  locked out of their own dashboard.
- 4–6 digits balances tappability with brute-force resistance under
  rate limiting.

**Implementation status:** PIN is stored as a salted hash on
`family_members.pin_hash` (existing column). Rate limiting is TBD —
will live in `src/lib/parent-pin.ts`.

**File(s):** `src/lib/parent-pin.ts` (TBD).

---

## 4. TaskInstance generation and idempotency

**Decided:**
- **Generation strategy:** lazy on read + nightly backfill.
- **Uniqueness:** unique constraint on `(task_id, due_date)`.
- A `TaskInstance` is created the first time a Today list for a given
  date is built that includes the task, OR by a nightly job that fills
  forward 7 days of upcoming instances for active recurring tasks.

**Rationale:**
- Pure lazy generation means a parent who never opens the dashboard
  for a week sees no historical instances for that week — bad for
  reporting / heatmap continuity.
- Pure eager generation (e.g., creating every instance for the next
  year up front) is wasteful storage and makes future Task edits
  expensive.
- Lazy + 7-day backfill matches the observable rhythm of family use.

**Implementation status:** TaskInstance table does not yet exist —
this is Batch C work. PRD §12 defines the shape.

**File(s):** `supabase/migrations/*_v0_task_instances.sql` (TBD).

---

## 5. Editing a Task vs existing instances

**Decided:** Edits apply to **future instances only**. Past instances
are **immutable** once created.

**Rationale:**
- A parent who edits "Make bed" to change its reference photo
  shouldn't accidentally invalidate three weeks of historical
  submissions that were measured against the old photo.
- Immutable past = honest historical record.
- The exception, eventually: bulk-edit-with-confirmation, which is
  out of MVP scope.

**Implementation status:** Enforced at the application layer in the
chore-edit screen until TaskInstance lands.

**File(s):** `src/app/app/chores/[chore_id].tsx`.

---

## 6. Kid-initiated metric

**Decided:** A completion is **kid-initiated** if it occurs in a child
session (not a parent-supervised one) AND is not preceded by a parent
reminder action within a **30-minute window**.

**Rationale:**
- The north-star outcome "reduced parental reminding" (PRD §3) is
  unmeasurable without this operational definition.
- 30 minutes is wide enough to capture the spectrum from "I just
  reminded them and they did it immediately" to "I reminded them
  before school and they did it after," but tight enough that a kid
  who completes a task hours later still gets credit for owning it.
- The "child session" distinction is captured via the session token's
  `role = 'kid'` flag.

**Implementation status:** Submissions don't yet carry a session-role
field. TBD: add `submissions.actor_role` and a server-side join to
the reminder log. Reminder log itself doesn't exist yet — it lands
with Batch B4 (notifications).

**File(s):** `src/lib/kid-initiated.ts` (TBD), `supabase/migrations/*_v0_actor_role.sql` (TBD).

---

## 7. AI failure fallback

**Decided:** On AI service timeout or error, the submission **routes to
the parent queue** with a neutral *"Sent for review"* state. Never
shame the kid by surfacing the error; never block their next attempt.

**Rationale:**
- AI vision is the most outage-prone piece of the loop. The kid must
  never be stuck or shamed by an outage they can't see.
- Routing to the parent matches the existing review-queue surface
  and uses zero new UI.
- A neutral status hides the AI failure from the kid entirely.

**Implementation status:** Already partially handled in
`supabase/functions/evaluate-submission/index.ts` — errors are
caught, but the routing path needs to set `status = 'pending_parent'`
explicitly instead of leaving it `pending_ai`. TODO comment added.

**File(s):** `supabase/functions/evaluate-submission/index.ts`,
`src/lib/use-override.ts`.

---

## 8. Children's photo privacy and retention

**Decided:**
- **Consent gate at setup:** parent confirms at signup they are 18+
  and the parent/guardian of any kid added (already implemented).
- **Minimal retention:** kid submission photos are retained as long
  as the kid is active in the household. Deletion of a kid → cascade
  delete of all their photos within 24 hours.
- **No third-party training use:** photos are passed to the AI
  evaluator (OpenAI vision via Supabase Edge Function) for inference
  only. We do not opt into any provider's training data programs.
- **Deletion on parent request:** the parent can delete any
  individual submission, which hard-deletes the underlying photo
  from Storage.

**Rationale:**
- Photos of minors carry legal and trust obligations.
- The "consent gate + minimal retention + no training use + deletion
  on request" combination is the standard responsible-storage shape
  for consumer apps in this category and matches the PRD's
  recommended default.

**Implementation status:** Consent gate is live. Cascade delete is
partial — parent can delete an individual submission, but kid-deletion
cascade is TBD. No training-use opt-in is currently configured.
Storage RLS is in place via `v0_submissions_insert_and_storage_rls`
and `v0_reference_photos_storage_rls`.

**File(s):** `src/app/signup.tsx`, `src/app/app/kid/[kid_id]/settings.tsx`,
`supabase/migrations/20260523010752_v0_submissions_insert_and_storage_rls.sql`.

---

## Decisions still owned by Erica (out of scope for this doc)

Tracked separately in `docs/workbook-decisions.md`:
- Number of age bands for MVP (Q6.1)
- AI pass / coach / route thresholds (Q7.1)
- Partial-completion handling (Q7.1)
- Guardrail / forbidden-phrase list (Q9.1)
- Reward / streak model direction (Q10)

---

## Engineering work still pending (post-Batch D)

Tracked here so the next session starts with full context.

### D6 — Instance-based status reading (medium scope)

**What it is:** Pivot the dashboard + kid tile to read today's status
from `chore_instances.status` instead of computing from submissions.

**Why deferred:** The existing submission-derived logic
(`choreStatusToday()`) is consistent for daily chores, which is every
chore in production today. The benefit of D6 is mostly invisible until
families have actual weekly chores. Half-implementing it would risk
breaking the working flow.

**To land it cleanly:**
1. Server-side trigger on `submissions` insert that finds today's
   `chore_instance` for (chore_id, kid_id) and updates its `status` to
   match the submission state. New file:
   `supabase/migrations/*_v0_submission_to_instance_trigger.sql`.
2. New helper in `chore-instances.ts`: `statusForInstance(instance)`
   returning the same `ChoreTodayStatus` enum that `choreStatusToday()`
   does today.
3. Refactor consumers (`parent-dashboard.tsx`, `parent-queue-view.tsx`,
   `/kid/index.tsx`, `/app/kid/[kid_id]/index.tsx`, `KidChoreTile`) to
   prefer instance-based status when an instance row exists, falling
   back to submission-derived for chores without an instance.
4. Verify the dashboard pulse counts (`familyHops`, `familyDone`,
   `familyRequired`, `familyAwaiting`) compute identically with the new
   path.

### D7 — Multi-household refactor (large, dedicated session)

**What it is:** Make a kid a top-level entity that can belong to
multiple parent households simultaneously. Standards travel with the
kid. Per Erica's June 3 ask (product-vision.md §3, §4¾).

**Why deferred:** Genuinely 3-5 days of focused engineering. Touches:
- Schema (new `kid_household_memberships` join table; `chores.family_id`
  semantics; potentially every FK referencing family_id)
- RLS on every table that references family_id (~10 policies)
- Auth context — parent needs a "currently viewing as household X" state
- Parent dashboard reconciliation: a co-parent in a second household
  sees the same kid, the same chore titles, but their own household's
  recognition + nudge log
- Standards reconciliation: when households disagree on a chore's
  reference photo or tips, whose wins? (Probably: per-household
  overrides, with a soft note when they diverge.)
- Migration story: a single-household kid today should silently become
  a multi-household-capable kid tomorrow without disruption.

**Recommended order for the dedicated session:**
1. Migration: `kid_household_memberships(kid_id, household_id,
   primary, joined_at)`. Existing kids get one row with
   `primary=true`.
2. Update every RLS policy to read membership instead of
   `family_members.family_id` directly. Test exhaustively in a branch
   database.
3. Auth context state: `activeHouseholdId` separate from
   `parentHouseholdIds[]`.
4. Parent dashboard: show all kids the parent has access to across all
   their households, grouped by household. Co-parent invitation flow.
5. Per-household overrides on chore standards.

### Smaller deferred items

- **Per-chore source field population.** B1 added `source?: string` on
  `ChoreSuggestion` but didn't populate any. Bucket-level sources
  already cover the surface in the UI. Defer until specific chores
  need overrides.
- **Parent PIN rate limiting.** Engineering-defaults §3 specifies the
  policy. No PIN flow exists in v0; Kid Mode unlock is currently
  uncovered. Land both together when shared-device Kid Mode lands.
- **Kid-deletion photo cascade.** Engineering-defaults §8. Parent can
  delete a kid (cascades to chores, submissions in DB), but Storage
  photos for that kid are orphaned. Sweeper job TBD.

### What requires a new native iOS build

- D5 (expo-notifications) requires a fresh native bundle. The next
  `fastlane beta` run picks it up. The current build (in flight when
  Batch B started) only delivers Batch A.

---

*This doc is the answer key for engineering decisions. If a future
engineer asks "did we ever decide X?" — check here. If a decision
needs to change, edit here first, then the code.*
