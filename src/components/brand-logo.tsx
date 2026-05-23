/**
 * Brand logo for parent-facing surfaces.
 *
 * Uses the full "Home Hero" lockup (icon + wordmark + "Chores Made Easier"
 * tagline). Per the brand split memo, this never appears on kid surfaces
 * (those use the bunny mascot + rounded text).
 *
 * Aspect ratio of the source PNG is ~1.5:1, so width is derived from
 * height. Default `height` is sized for a navbar; pass a bigger number
 * for the landing hero.
 */

import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

// Aspect ratio of the cropped, tight-bbox logo (icon + wordmark + tagline).
// If you swap the PNG, recompute this as image.width / image.height.
const SOURCE_ASPECT = 3.522;

type Props = {
  height?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function BrandLogo({ height = 36, style, accessibilityLabel = 'Home Hero' }: Props) {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('@/assets/images/logo.png')}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[{ height, width: height * SOURCE_ASPECT }, style]}
    />
  );
}

// Keep the StyleSheet around in case we want to add hover / focus
// styling later (e.g., subtle opacity on press in a link).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const styles = StyleSheet.create({});
