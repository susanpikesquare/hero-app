/**
 * Lightweight haptic feedback for the kid reward moments.
 *
 * Uses React Native's built-in Vibration API — NO extra native module,
 * so it ships in the normal build with no CocoaPods/relink step. On
 * native it triggers a real device vibration; on web it's a no-op (iOS
 * Safari ignores navigator.vibrate anyway).
 *
 * Upgrade path (deferred): expo-haptics gives the crisp Taptic Engine
 * "success" pattern (di-dum) which feels noticeably more rewarding than
 * a plain buzz. Adding it needs `expo install expo-haptics` + a pod
 * install + a native rebuild. When we do that, swap the bodies here and
 * every call site keeps working — that's why this is a thin wrapper.
 */

import { Platform, Vibration } from 'react-native';

/** A small tap — for button presses / picking an option. */
export function hapticTap(): void {
  if (Platform.OS === 'web') return;
  try {
    Vibration.vibrate(12);
  } catch {
    // Some devices/simulators have no vibrator — never let this throw.
  }
}

/** A celebratory buzz — for completing a chore successfully. */
export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  try {
    // A short double pulse reads as "yes!" rather than an alert. iOS
    // collapses the pattern to a single vibration, which is still a
    // clean positive cue; Android honors the pattern.
    Vibration.vibrate([0, 35, 60, 45]);
  } catch {
    // no-op
  }
}
