/**
 * Expo push-token registration (kid's own device).
 *
 * Stores the device's Expo push token against the kid's family_member id
 * so the `send-nudge` Edge Function can deliver a parent's nudge to the
 * kid's phone as a real push notification.
 *
 * Scope:
 *   - Native only. Web returns immediately (no Expo push tokens on web).
 *   - Real devices only. Simulators/emulators can't get a push token —
 *     getExpoPushTokenAsync throws there, so we bail on Device.isDevice.
 *   - Called from the kid's OWN-device home (/kid). The parent-supervised
 *     "Hand to" view (/app/kid/[id]) runs on the parent's device, so a
 *     push-to-kid there would just buzz the parent's own phone — we don't
 *     register tokens from that surface.
 *
 * Permission: reuses the same gentle ask-once pattern as kid-reminders.
 * If the user previously denied, the OS won't re-prompt and we no-op.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

// EAS project id — required by getExpoPushTokenAsync to mint a token
// scoped to this app. Matches app.json → extra.eas.projectId.
const EAS_PROJECT_ID = 'c57d21d9-4a51-4d3d-b657-2dd4cb045b5a';

/**
 * Feature gate. The iOS build currently ships WITHOUT the `aps-environment`
 * (push) entitlement — ios/HomeHero/HomeHero.entitlements is empty. On a
 * real device, Notifications.getExpoPushTokenAsync() then calls
 * registerForRemoteNotifications, which iOS rejects with a NATIVE
 * exception that a JS try/catch cannot catch — crashing the app the moment
 * the kid opens their own-device home (Susan + Erica QA, 2026-07-25:
 * "can't log in as kid").
 *
 * Remote push was never going to work without that entitlement anyway, so
 * we hard-disable token registration until it's provisioned. To re-enable:
 *   1. Add `aps-environment` to HomeHero.entitlements (+ the Push
 *      Notifications capability) and an APNs key in App Store Connect.
 *   2. Flip this to true.
 * Local reminders (kid-reminders.ts) are unaffected — they don't touch
 * remote registration.
 */
const PUSH_TOKENS_ENABLED = false;

/**
 * Register (or refresh) this device's Expo push token for the given kid
 * member. Idempotent — upserts on (member_id, expo_push_token). Best
 * effort: any failure is logged and swallowed so it never blocks the
 * kid's home screen from rendering.
 */
export async function registerPushToken(memberId: string): Promise<void> {
  if (!PUSH_TOKENS_ENABLED) return;
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;
  if (!memberId) return;

  try {
    // Permission — ask once; respect a prior denial.
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted && settings.canAskAgain) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return;

    const tokenResp = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    const token = tokenResp.data;
    if (!token) return;

    const { error } = await supabase
      .from('device_push_tokens')
      .upsert(
        {
          member_id: memberId,
          expo_push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,expo_push_token' }
      );
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('registerPushToken upsert failed:', error.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('registerPushToken failed:', err);
  }
}
