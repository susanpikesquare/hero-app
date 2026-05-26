/**
 * Branded callout that surfaces ADHD developmental guidance for a kid's
 * age bucket. Used on:
 *   - /app/kid/[kid_id]/setup (above the chore picker — calibrate
 *     expectations BEFORE choosing chores)
 *   - /app/kid/[kid_id]/settings (under the profile — re-read anytime)
 *
 * The kid never sees this card. It's a parent-facing frame written by
 * (eventually) a licensed therapist.
 */

import { StyleSheet, View } from 'react-native';

import { BrandHeading } from '@/components/brand-heading';
import { ThemedText } from '@/components/themed-text';
import { Radius, ReadableContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { guidanceForAge } from '@/lib/age-guidance';

type Props = {
  /** Kid's age in years. null/undefined → defaults to the 7–9 bucket. */
  age: number | null | undefined;
  /** Optional first name to personalize the framing. Falls back to "your kid". */
  kidName?: string;
};

export function AgeGuidanceCard({ age, kidName }: Props) {
  const theme = useTheme();
  const guidance = guidanceForAge(age);
  const subject = kidName ?? 'your kid';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <BrandHeading level="eyebrow" themeColor="accent">
        ADHD development · {guidance.label}
      </BrandHeading>
      <BrandHeading level="h2" style={styles.title}>
        What&apos;s typical for {subject} right now.
      </BrandHeading>
      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.frame}
      >
        {guidance.frame}
      </ThemedText>

      <View style={styles.dimensions}>
        <Dimension
          label="Social"
          body={guidance.dimensions.social}
          theme={theme}
        />
        <Dimension
          label="Emotional"
          body={guidance.dimensions.emotional}
          theme={theme}
        />
        <Dimension
          label="Cognitive"
          body={guidance.dimensions.cognitive}
          theme={theme}
        />
      </View>

      <View
        style={[
          styles.implication,
          { backgroundColor: theme.accentSoft, borderColor: theme.accent },
        ]}
      >
        <ThemedText
          type="smallBold"
          themeColor="accent"
          style={styles.implicationEyebrow}
        >
          What this means for chore-picking
        </ThemedText>
        <ThemedText
          type="default"
          themeColor="text"
          style={styles.implicationBody}
        >
          {guidance.choreImplication}
        </ThemedText>
      </View>
    </View>
  );
}

function Dimension({
  label,
  body,
  theme,
}: {
  label: string;
  body: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.dimensionRow}>
      <ThemedText
        type="smallBold"
        themeColor="info"
        style={styles.dimensionLabel}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="default"
        themeColor="text"
        style={[styles.dimensionBody, { color: theme.text }]}
      >
        {body}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  title: {
    maxWidth: ReadableContentWidth,
    marginTop: Spacing.one,
  },
  frame: {
    fontSize: 17,
    lineHeight: 28,
    maxWidth: ReadableContentWidth,
  },
  dimensions: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  dimensionRow: {
    gap: Spacing.one,
  },
  dimensionLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  dimensionBody: {
    fontSize: 16,
    lineHeight: 25,
  },
  implication: {
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.one,
  },
  implicationEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontSize: 13,
  },
  implicationBody: {
    fontSize: 16,
    lineHeight: 25,
  },
});
