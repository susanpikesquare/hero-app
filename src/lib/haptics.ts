/**
 * Haptic feedback for the kid reward moments — now backed by expo-haptics
 * for the crisp Taptic Engine feel (a real "di-dum" success tap rather
 * than a flat buzz).
 *
 * Native only; no-op on web. Every call is fire-and-forget with a
 * swallowed rejection so a device without a Taptic engine (or a denied
 * capability) never throws into the UI.
 *
 * NOTE: this is a purely additive iOS module (no push/APNs) — unlike the
 * push-token path, it doesn't need an entitlement and won't crash.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** A light tap — for button presses / picking an option. */
export function hapticTap(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** The celebratory success pattern — for completing a chore. */
export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}
