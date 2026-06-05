/**
 * Standalone review-queue route. Renders the iOS-shaped queue view on
 * every platform so a parent on web can land here from the dashboard's
 * "X awaiting your review" pill (which previously did nothing — that
 * was the bug Susan reported).
 *
 * The queue is the platform-agnostic single-purpose review surface; the
 * dashboard's "Recent submissions" card is the broader, mixed-state
 * history. Different jobs, different routes.
 */

import { ParentQueueView } from '@/components/parent-queue-view';

export default function QueueRoute() {
  return <ParentQueueView />;
}
