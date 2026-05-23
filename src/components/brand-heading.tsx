import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Level = 'display' | 'h1' | 'h2' | 'h3' | 'eyebrow';

export type BrandHeadingProps = TextProps & {
  level?: Level;
  themeColor?: ThemeColor;
};

export function BrandHeading({
  level = 'h1',
  themeColor,
  style,
  ...rest
}: BrandHeadingProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        level === 'display' && styles.display,
        level === 'h1' && styles.h1,
        level === 'h2' && styles.h2,
        level === 'h3' && styles.h3,
        level === 'eyebrow' && styles.eyebrow,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.serif,
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: Fonts.serif,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '500',
  },
  h3: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '500',
  },
  eyebrow: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: Platform.OS === 'web' ? 1.5 : 1,
    textTransform: 'uppercase',
  },
});
