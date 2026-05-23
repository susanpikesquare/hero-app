/**
 * Always-the-dashboard route. Reached from the iOS queue's "Dashboard"
 * button when a parent wants the fuller view. Web users normally hit
 * /app for the same content, but /app/dashboard works on both.
 */

import { ParentDashboard } from '@/components/parent-dashboard';

export default function DashboardRoute() {
  return <ParentDashboard />;
}
