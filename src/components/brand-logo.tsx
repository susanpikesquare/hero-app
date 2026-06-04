/**
 * Brand logo for parent-facing surfaces.
 *
 * Uses the full "Home Hero" lockup (icon + wordmark + "Chores Made Easier"
 * tagline). Per the brand split memo, this never appears on kid surfaces
 * (those use the bunny mascot + rounded text).
 *
 * Aspect ratio of the source PNG is ~3.5:1, so width is derived from
 * height. Default `height` is sized for a navbar; pass a bigger number
 * for the landing hero.
 *
 * Responsive sizing: if a caller passes a desktop-sized height (≥ 64),
 * we automatically scale it down on narrow viewports so the logo doesn't
 * eat the entire nav row and push the action buttons off-screen. Heights
 * already < 64 are assumed phone-tuned and left alone. Pass
 * `responsive={false}` to opt out entirely (e.g., for an intentionally
 * giant landing hero).
 */

import {
  Image,
  StyleSheet,
  useWindowDimensions,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

// Aspect ratio of the cropped, tight-bbox logo (icon + wordmark + tagline).
// If you swap the PNG, recompute this as image.width / image.height.
const SOURCE_ASPECT = 3.522;

// Below this viewport width we treat the surface as "phone-shaped" and
// shrink a desktop-sized logo. 768px is a common phone/tablet cutoff and
// matches the responsive break we use elsewhere.
const NARROW_VIEWPORT_WIDTH = 768;

// On narrow viewports, cap the logo height at this value. 44px renders
// the lockup at ~155px wide — leaves plenty of room for nav action buttons.
const PHONE_LOGO_HEIGHT = 44;

type Props = {
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /**
   * When true (default) and `height` ≥ 64, the logo automatically shrinks
   * to PHONE_LOGO_HEIGHT on viewports narrower than NARROW_VIEWPORT_WIDTH.
   * Set false on intentional desktop heroes that should stay big.
   */
  responsive?: boolean;
};

export function BrandLogo({
  height = 36,
  style,
  accessibilityLabel = 'Home Hero',
  responsive = true,
}: Props) {
  const { width } = useWindowDimensions();
  const isNarrow = width < NARROW_VIEWPORT_WIDTH;
  // Only downscale heights that look desktop-sized. Phone-tuned callsites
  // (height 40, 56) already fit on a phone and shouldn't get re-shrunk.
  const effectiveHeight =
    responsive && isNarrow && height >= 64 ? PHONE_LOGO_HEIGHT : height;

  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('@/assets/images/logo.png')}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        { height: effectiveHeight, width: effectiveHeight * SOURCE_ASPECT },
        style,
      ]}
    />
  );
}

// Keep the StyleSheet around in case we want to add hover / focus
// styling later (e.g., subtle opacity on press in a link).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const styles = StyleSheet.create({});
