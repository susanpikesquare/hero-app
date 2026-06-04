/**
 * Step 0 — Welcome / Arrival.
 *
 * Per Erica's June 3 working session: before the parent adds a kid,
 * before they pick a chore, they arrive. The job of this screen is to
 * meet them where they are — name the felt experience verbatim
 * ("Endlessly frustrated, exhausted, and distanced from those you love
 * most"), tell them the app is going to take some of this load, and
 * let them step in.
 *
 * The route gate is in /app/_layout.tsx: a parent whose
 * `families.parent_welcomed_at` is NULL gets redirected here. On
 * "Let's begin," we write the timestamp and forward to the dashboard.
 * Skippable — but skipping still writes the timestamp so we don't
 * loop them back here.
 *
 * Tone: warm, not clinical. No diagnosis language. No "ADHD." Just the
 * felt experience and the relief.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/lib/use-family';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { family, loading } = useFamily(!!session);
  const [completing, setCompleting] = useState(false);

  const markWelcomed = async () => {
    if (!family || completing) return;
    setCompleting(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ parent_welcomed_at: new Date().toISOString() })
        .eq('id', family.id);
      if (error) {
        // Don't block the parent. The worst case is they see the welcome
        // again next time; we'd rather that than strand them here.
        console.error('Could not mark welcome complete:', error);
      }
      router.replace('/app');
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !family) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          One moment…
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.logoBlock}>
            <BrandLogo height={64} />
          </View>

          <View style={styles.hero}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Welcome to Home Hero
            </BrandHeading>
            <BrandHeading level="h1" style={styles.heroTitle}>
              You are not behind.
            </BrandHeading>
            <BrandHeading level="h2" style={styles.heroTitleSub}>
              You are just very tired.
            </BrandHeading>
          </View>

          {/* The felt-experience callout. Erica's verbatim line. This is
              the load-bearing copy of the screen — name it, so the
              parent feels seen before they're asked to do anything. */}
          <View
            style={[
              styles.feltCard,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
          >
            <ThemedText
              type="default"
              style={[styles.feltLine, { color: theme.text }]}
            >
              Endlessly frustrated, exhausted, and distanced from those you
              love most.
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted">
              If that lands — you're in the right place. Most parents we
              build for are carrying more than is reasonable to carry.
            </ThemedText>
          </View>

          <View style={styles.bodyBlock}>
            <ThemedText
              type="default"
              themeColor="text"
              style={styles.bodyP}
            >
              Home Hero is a family operating system, not a chore chart.
              The app takes the daily managing — the reminders, the
              standard-keeping, the specific feedback — off your voice and
              onto a calm, neutral surface.
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="text"
              style={styles.bodyP}
            >
              The parts of parenting that actually need you get you. The
              parts that have been quietly eating your attention go to the
              app. So the time you save shows up where it matters — being
              present with your kids, not running the house around them.
            </ThemedText>
            <ThemedText
              type="default"
              themeColor="text"
              style={styles.bodyP}
            >
              We are a co-pilot for the daily moments. Nothing more,
              nothing less. If your family is carrying something larger
              than the daily, we'll quietly point you toward someone who
              can help — never the other way around.
            </ThemedText>
          </View>

          <View
            style={[
              styles.aspirationCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              themeColor="accent"
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            >
              What we are building toward
            </ThemedText>
            <View style={styles.aspirationRow}>
              <Aspiration label="Harmony" theme={theme} />
              <Aspiration label="Peace" theme={theme} />
              <Aspiration label="Joy" theme={theme} />
            </View>
            <ThemedText type="default" themeColor="textSecondary">
              Not productivity, not perfect kids, not a tidy house. The
              three words above are the test every feature has to pass.
            </ThemedText>
          </View>

          <View style={styles.cta}>
            <BrandButton
              label={completing ? "Let's begin…" : "Let's begin"}
              onPress={markWelcomed}
              disabled={completing}
            />
          </View>

          <ThemedText
            type="small"
            themeColor="textMuted"
            style={styles.footer}
          >
            You'll see this screen once. You can revisit it from Settings
            anytime you want a reminder of why you started.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function Aspiration({
  label,
  theme,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.aspirationChip,
        { backgroundColor: theme.accentSoft, borderColor: theme.accent },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{ color: theme.accent, textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
    alignItems: 'flex-start',
  },
  logoBlock: { alignSelf: 'flex-start' },
  hero: {
    gap: Spacing.one,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  heroTitle: { marginTop: Spacing.three },
  heroTitleSub: { marginTop: 0 },
  feltCard: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  feltLine: {
    fontSize: 20,
    lineHeight: 30,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  bodyBlock: {
    gap: Spacing.three,
    maxWidth: ReadableContentWidth,
  },
  bodyP: { fontSize: 17, lineHeight: 28 },
  aspirationCard: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  aspirationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  aspirationChip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  cta: { marginTop: Spacing.three },
  footer: { marginTop: Spacing.two, maxWidth: ReadableContentWidth },
});
