/**
 * Branded callout that surfaces age-appropriate developmental guidance
 * for a kid's age bucket. Used on:
 *   - /app/kid/[kid_id]/setup (above the chore picker — calibrate
 *     expectations BEFORE choosing chores)
 *   - /app/kid/[kid_id]/settings (under the profile — re-read anytime)
 *
 * Content lives in `src/lib/age-guidance.ts`. When the parent has
 * selected one or more support profiles for the kid (ADHD, autism,
 * anxiety, sensory, not_sure), the optional `neurodivergentLens`
 * paragraph surfaces as an additional callout, plus a "Tuning for:"
 * line that names the selected profiles so the parent SEES that their
 * selection is being honored (Susan QA, 2026-06-08).
 *
 * Per-profile lens content (a different paragraph for ADHD vs anxiety
 * vs autism) is on the content roadmap — for now we render the same
 * neurodivergent lens regardless of which profile is selected, since
 * it's the only profile-aware content currently in age-guidance.ts.
 *
 * The kid never sees this card. It's parent-facing reframing content,
 * synthesized from published developmental guidance — not clinical or
 * therapeutic advice.
 */

import { StyleSheet, View } from 'react-native';

import { BrandHeading } from '@/components/brand-heading';
import { ThemedText } from '@/components/themed-text';
import { Radius, ReadableContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { guidanceForAge } from '@/lib/age-guidance';
import {
  PROFILE_CHORE_TUNING,
  PROFILE_OPTIONS,
  type SupportProfile,
} from '@/lib/neurodivergence-context';

type Props = {
  /** Kid's age in years. null/undefined → defaults to the 7–9 bucket. */
  age: number | null | undefined;
  /** Optional first name to personalize the framing. Falls back to "your kid". */
  kidName?: string;
  /** Support profiles set on the kid (ADHD, autism, anxiety, etc.).
   *  When any are set, the card adds a "Tuning for: …" line and
   *  surfaces the neurodivergent-lens callout. */
  profiles?: SupportProfile[];
};

export function AgeGuidanceCard({ age, kidName, profiles }: Props) {
  const theme = useTheme();
  const guidance = guidanceForAge(age);
  const subject = kidName ?? 'your kid';
  const activeProfiles = profiles ?? [];
  const hasProfiles = activeProfiles.length > 0;
  const profileLensText = guidance.neurodivergentLens;

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
        Developmental support · {guidance.label}
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

      {/* When the parent has set support profiles for this kid, surface
          profile-aware guidance as a separate callout so the parent SEES
          the framework responding to their selection (Susan QA,
          2026-06-08). We render:
            1. A per-profile chore-tuning line for EACH selected profile,
               so ADHD vs anxiety produce visibly different guidance.
            2. The age-band neurodivergent lens, if present, as shared
               scaffolding context underneath. */}
      {hasProfiles && (
        <View
          style={[
            styles.lensCallout,
            { backgroundColor: '#F0EAFB', borderColor: '#C8B6E5' },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={[styles.lensEyebrow, { color: '#5B3A8F' }]}
          >
            Tuning {subject}&apos;s chores for what you told us
          </ThemedText>
          {activeProfiles.map((p) => {
            const label =
              PROFILE_OPTIONS.find((o) => o.value === p)?.label ?? p;
            const tuning = PROFILE_CHORE_TUNING[p];
            if (!tuning) return null;
            return (
              <View key={p} style={styles.lensProfileRow}>
                <ThemedText
                  type="smallBold"
                  style={{ color: '#5B3A8F' }}
                >
                  {label}
                </ThemedText>
                <ThemedText
                  type="default"
                  themeColor="text"
                  style={styles.implicationBody}
                >
                  {tuning}
                </ThemedText>
              </View>
            );
          })}
          {profileLensText && (
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={[styles.implicationBody, { marginTop: Spacing.two }]}
            >
              {profileLensText}
            </ThemedText>
          )}
        </View>
      )}
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
  lensCallout: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.one,
  },
  lensEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontSize: 13,
  },
  lensProfileRow: {
    gap: 2,
    marginTop: Spacing.one,
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
