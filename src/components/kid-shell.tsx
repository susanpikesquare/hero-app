/**
 * Kid-facing surface. Same muted palette as the parent side, but with the
 * rounded font and a friendly bunny mascot — per the brand split memo:
 * the bunny only ever appears on kid surfaces, never on parent-facing pages
 * or the marketing landing.
 */

import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  children: ReactNode;
  back?: { href: '/app' | (string & {}); label: string };
};

export function KidShell({ children, back = { href: '/app', label: 'Back to grown-ups' } }: Props) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <View style={styles.wordmarkWrap}>
              <Text style={styles.bunny} accessibilityLabel="bunny">
                🐰
              </Text>
              <Text style={[styles.wordmark, { color: theme.text }]}>
                Home Hero
              </Text>
            </View>
            <Pressable
              onPress={() => router.replace(back.href as any)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.backBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                },
              ]}
            >
              <Text style={[styles.backLabel, { color: theme.text }]}>
                {back.label}
              </Text>
            </Pressable>
          </View>

          {children}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', flexGrow: 1 },
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  wordmarkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bunny: { fontSize: 26 },
  wordmark: {
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  backBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  backLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 14,
    fontWeight: '600',
  },
});

export const KidStyles = StyleSheet.create({
  greetingEyebrow: {
    fontFamily: Fonts.rounded,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  greetingSub: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    lineHeight: 26,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  choreTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 22,
    fontWeight: '700',
  },
  choreBody: {
    fontFamily: Fonts.rounded,
    fontSize: 15,
    lineHeight: 22,
  },
  bigButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  bigButtonLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    fontWeight: '700',
  },
});
