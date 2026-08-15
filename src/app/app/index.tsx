/**
 * Parent home — the dashboard on every platform.
 *
 * Previously iOS showed only the bare review queue and you had to tap
 * into "Dashboard" to see progress. Per the 2026-07-25 meeting ("the
 * home should have the progress plus the tasks for the parents to
 * complete"), the parent lands on the full dashboard everywhere: the
 * family pulse (progress + hops), each kid, and a prominent "ready for
 * your eyes" chip that jumps straight to the review queue (/app/queue).
 * The queue still exists as its own focused surface for one-tap review.
 */

import { ParentDashboard } from '@/components/parent-dashboard';

export default function ParentHome() {
  return <ParentDashboard />;
}
