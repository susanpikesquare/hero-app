/**
 * Home Hero brand tokens.
 *
 * Two visual languages live here (see project memory: project_brand_split):
 *   - Parent-facing surfaces (landing page, parent dashboard) use the
 *     muted "clinical-with-warmth" palette and serif headings.
 *   - Kid-facing surfaces (in-app kid view) reuse the same palette but
 *     get the rounded font + bunny mascot illustrations.
 */

import '@/global.css';

import { Platform } from 'react-native';

const palette = {
  cream50: '#FBF8F2',
  cream100: '#F7F3EB',
  cream200: '#EDE6D8',
  sage100: '#D8E3D6',
  sage300: '#A8BDA5',
  sage500: '#7A957A',
  sage700: '#5E7A5C',
  dustyBlue100: '#D6E0EA',
  dustyBlue300: '#A0B5C9',
  dustyBlue500: '#7A95B0',
  dustyBlue700: '#4D6B89',
  warmGray100: '#E8E4DE',
  warmGray300: '#A8A39C',
  warmGray500: '#6B6660',
  warmGray700: '#3A3530',
  warmGray900: '#1F1B17',
} as const;

export const Colors = {
  light: {
    text: palette.warmGray700,
    textSecondary: palette.warmGray500,
    textMuted: palette.warmGray300,
    background: palette.cream50,
    backgroundElement: palette.cream100,
    backgroundSelected: palette.cream200,
    accent: palette.sage700,
    accentSoft: palette.sage100,
    info: palette.dustyBlue700,
    infoSoft: palette.dustyBlue100,
    border: palette.warmGray100,
  },
  dark: {
    text: palette.cream50,
    textSecondary: palette.warmGray300,
    textMuted: palette.warmGray500,
    background: palette.warmGray900,
    backgroundElement: palette.warmGray700,
    backgroundSelected: '#2A2522',
    accent: palette.sage300,
    accentSoft: '#2A352A',
    info: palette.dustyBlue300,
    infoSoft: '#2A3540',
    border: palette.warmGray500,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
  eight: 96,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1080;
export const ReadableContentWidth = 680;
