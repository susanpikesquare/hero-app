/**
 * Kid-side local notifications (MVP — Erica's June 3 ask).
 *
 * Schedules two reminders per kid per day on the kid's own device:
 *   1. Morning (default 7:30am local) — "today's hero work is ready"
 *   2. Afternoon (default 3:30pm local) — surfaces when the kid is
 *      typically home from school
 *
 * The notification body is intentionally light and encouragement-first.
 * It does NOT enumerate today's tasks — that would be too long for a
 * notification and would feel like a chore list arriving on the lock
 * screen. The notification just says "your stuff is waiting" and the
 * tap opens the Today list.
 *
 * Scope notes:
 *   - Cross-device push (parent → kid, kid completion → parent) is
 *     deferred to Beta (PRD §9.13). This file only does local
 *     scheduling on the kid's device.
 *   - We schedule for tomorrow as well as today so reminders survive
 *     midnight. The library de-dupes by `identifier` so calling
 *     `scheduleForKid` again the same day is safe.
 *   - Web has no local notifications. Calls become no-ops there.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const MORNING_HOUR = 7;
const MORNING_MINUTE = 30;
const AFTERNOON_HOUR = 15;
const AFTERNOON_MINUTE = 30;

/**
 * Asks the OS for notification permission. Idempotent: if already
 * granted, returns true immediately. If the user previously denied, the
 * OS will not re-prompt; we return false and the caller silently moves
 * on. Returns false on web.
 */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  }
  return false;
}

function reminderIdentifier(kidId: string, slot: 'morning' | 'afternoon'): string {
  return `kid-reminder:${kidId}:${slot}`;
}

/**
 * Schedule morning + afternoon reminders for the next occurrence on this
 * device. Cancels and re-schedules to avoid duplicates. Safe to call
 * multiple times per day.
 */
export async function scheduleForKid(opts: {
  kidId: string;
  kidName: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  const granted = await ensurePermission();
  if (!granted) return;

  // Cancel existing reminders for this kid.
  await Promise.all(
    (['morning', 'afternoon'] as const).map((slot) =>
      Notifications.cancelScheduledNotificationAsync(
        reminderIdentifier(opts.kidId, slot)
      ).catch(() => undefined)
    )
  );

  // Schedule a daily-repeating reminder at each slot. expo-notifications
  // takes the next firing in local time and repeats every 24 hours after
  // that (DAILY trigger).
  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(opts.kidId, 'morning'),
    content: {
      title: `Good morning, ${opts.kidName}`,
      body: "Today's hero work is ready when you are. Tap to see it.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: MORNING_HOUR,
      minute: MORNING_MINUTE,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(opts.kidId, 'afternoon'),
    content: {
      title: `Hi ${opts.kidName}`,
      body: "Afternoon check-in — anything left for today?",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: AFTERNOON_HOUR,
      minute: AFTERNOON_MINUTE,
    },
  });
}

/**
 * Cancel both reminders for a kid. Called on sign-out.
 */
export async function cancelForKid(kidId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all(
    (['morning', 'afternoon'] as const).map((slot) =>
      Notifications.cancelScheduledNotificationAsync(
        reminderIdentifier(kidId, slot)
      ).catch(() => undefined)
    )
  );
}
