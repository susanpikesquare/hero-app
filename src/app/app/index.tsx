/**
 * Parent home. Platform-aware:
 *   - iOS  → review queue (parent is on the go, optimize for one-tap decisions)
 *   - web  → full dashboard (parent is at the desk, optimize for context + config)
 *
 * Both surfaces share the same data; this file just routes the render.
 * Web users can still hit /app/queue if we ever add a link; iOS users can
 * reach the dashboard via the "Dashboard" button in the queue's nav, which
 * routes to /app/dashboard.
 */

import { Platform } from 'react-native';

import { ParentDashboard } from '@/components/parent-dashboard';
import { ParentQueueView } from '@/components/parent-queue-view';

export default function ParentHome() {
  if (Platform.OS === 'ios') {
    return <ParentQueueView />;
  }
  return <ParentDashboard />;
}
