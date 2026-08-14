/**
 * Home Hero renders in its warm, light "clinical-with-warmth" brand
 * palette on every device, regardless of the OS dark-mode setting.
 *
 * Why locked to light (Susan + Erica QA, 2026-07-25): the brand IS this
 * cream/sage palette, and the dark palette was never designed against —
 * several cards hardcode light backgrounds and paired theme-adaptive
 * text, so on a phone set to Dark Mode multiple boxes rendered
 * near-white text on a light card ("the purpose box has white text you
 * can't read"). Rather than an open-ended dark-mode audit, we render the
 * intended light look everywhere. A proper dark theme can be designed
 * later and re-enabled by restoring the useColorScheme branch below +
 * flipping app.json userInterfaceStyle back to "automatic".
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.light;
}
