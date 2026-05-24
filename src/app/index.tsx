import { Link, useRouter } from 'expo-router';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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

const INVITE_EMAIL = 'susan@pikesquare.co';
const INVITE_SUBJECT = 'Home Hero — invite request';
const INVITE_BODY =
  "Hi,\n\nI'd like an invite code for Home Hero. A bit about my family:\n\n— ";

const PILLARS = [
  {
    title: 'Clinical standards, in your kitchen.',
    body: 'Therapist-built reference photos define what "done" looks like — the same way our therapist would in session.',
  },
  {
    title: 'Less nagging, more nervous-system rest.',
    body: 'Redistribute the invisible labor. One nervous system stops carrying the whole home.',
  },
  {
    title: 'Connection over correction.',
    body: 'Feedback is always encouragement-first: "I can see your effort — here\'s how to hit a home run."',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Set the standard.',
    body: 'Start from a therapist-designed reference room. After a few rounds, you upload a photo of your own — your kid\'s actual clean space becomes the bar.',
  },
  {
    n: '02',
    title: 'Your kid submits.',
    body: 'A photo of their finished bedroom. AI checks it against your standard and gives kind, specific feedback.',
  },
  {
    n: '03',
    title: 'You stay in charge.',
    body: 'You see every result and can override the AI when life calls for it — with a one-tap reason that keeps the relationship intact.',
  },
];

export default function LandingScreen() {
  // Native iOS surface gets a stripped-down chooser instead of the full
  // marketing page. Someone who downloaded the iOS app already knows what
  // Home Hero is — they need to act, not read. Web users (often arriving
  // from a link or search) still get the full pitch.
  if (Platform.OS === 'ios') {
    return <IOSChooserLanding />;
  }
  return <WebMarketingLanding />;
}

function IOSChooserLanding() {
  const theme = useTheme();
  const router = useRouter();

  const requestInvite = () => {
    const subject = encodeURIComponent(INVITE_SUBJECT);
    const body = encodeURIComponent(INVITE_BODY);
    Linking.openURL(`mailto:${INVITE_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView
      style={[styles.iosRoot, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.iosContainer}>
        {/* Top: logo + greeting. Sized so the action stack always fits
            on the smallest supported iPhone (SE 4.7") without scrolling. */}
        <View style={styles.iosHero}>
          <BrandLogo height={56} />
          <View style={styles.iosHeroText}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Welcome
            </BrandHeading>
            <BrandHeading level="h1" style={styles.iosTitle}>
              Home Hero
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.iosSub}
            >
              AI-validated chores for ADHD families.
            </ThemedText>
          </View>
        </View>

        {/* Three primary actions, stacked full-width for tappability. */}
        <View style={styles.iosActions}>
          <BrandButton
            label="I have a code"
            onPress={() => router.push('/signup')}
          />
          <BrandButton
            variant="ghost"
            label="I'm a kid"
            onPress={() => router.push('/kid/join')}
          />
          <BrandButton
            variant="ghost"
            label="Sign in"
            onPress={() => router.push('/login')}
          />
        </View>

        {/* Footer: invite-request link + legal. The invite link is below
            the primary actions because most parents arriving here will
            already have a code from us. */}
        <View style={styles.iosFooter}>
          <Pressable onPress={requestInvite} hitSlop={8}>
            <ThemedText
              type="small"
              style={[
                styles.iosInviteLink,
                { color: theme.info },
              ]}
            >
              Don&apos;t have a code yet? Request an invite →
            </ThemedText>
          </Pressable>
          <View style={styles.iosLegalRow}>
            <Link
              href="/privacy"
              style={[styles.iosLegalLink, { color: theme.textMuted }]}
            >
              Privacy
            </Link>
            <ThemedText type="small" themeColor="textMuted">
              ·
            </ThemedText>
            <Link
              href="/terms"
              style={[styles.iosLegalLink, { color: theme.textMuted }]}
            >
              Terms
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function WebMarketingLanding() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const requestInvite = () => {
    const subject = encodeURIComponent(INVITE_SUBJECT);
    const body = encodeURIComponent(INVITE_BODY);
    Linking.openURL(`mailto:${INVITE_EMAIL}?subject=${subject}&body=${body}`);
  };
  const goToSignup = () => router.push('/signup');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={isWide ? 96 : 64} />
            <View style={styles.navActions}>
              <Link
                href="/kid/join"
                style={[styles.navLink, { color: theme.textSecondary }]}
              >
                I’m a kid
              </Link>
              <Link
                href="/login"
                style={[styles.navLink, { color: theme.textSecondary }]}
              >
                Sign in
              </Link>
              <BrandButton
                variant="ghost"
                label="Get an invite"
                onPress={requestInvite}
              />
            </View>
          </View>

          <View style={[styles.hero, isWide && styles.heroWide]}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Built with therapists · for ADHD families
            </BrandHeading>
            <BrandHeading
              level={isWide ? 'display' : 'h1'}
              style={styles.heroTitle}
            >
              Expert clinical care for the home — not just the therapy office.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.heroSub}
            >
              Home Hero brings AI-validated chore standards into your home, so
              the invisible labor of remembering, reminding, and re-checking
              stops landing on one exhausted nervous system.
            </ThemedText>
            <View style={styles.heroCTA}>
              <BrandButton label="Get an invite" onPress={requestInvite} />
              <BrandButton
                variant="ghost"
                label="I have a code"
                onPress={goToSignup}
              />
            </View>
            <ThemedText type="small" themeColor="textMuted" style={styles.heroFootnote}>
              Invite-only while we work with our first cohort of families.
            </ThemedText>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <BrandHeading level="eyebrow" themeColor="info">
              Why a chore app, really
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Your home isn't broken. The system is.
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              When one person ends up responsible for remembering, tracking,
              initiating, enforcing, correcting, and following up — they
              quietly shift from partner or parent into manager, controller,
              exhausted regulator. That damages the relationships the home is
              supposed to protect.
            </ThemedText>
            <View style={[styles.pillarGrid, isWide && styles.pillarGridWide]}>
              {PILLARS.map((p) => (
                <View
                  key={p.title}
                  style={[
                    styles.pillarCard,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <BrandHeading level="h3" style={styles.pillarTitle}>
                    {p.title}
                  </BrandHeading>
                  <ThemedText type="default" themeColor="textSecondary">
                    {p.body}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <BrandHeading level="eyebrow" themeColor="accent">
              How it works
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Three steps. One bedroom to start.
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              v0 starts with the single hardest chore in most ADHD homes:
              tidy room, bed made. We get this bulletproof — then we expand.
            </ThemedText>
            <View style={styles.steps}>
              {STEPS.map((s) => (
                <View key={s.n} style={styles.step}>
                  <BrandHeading
                    level="h3"
                    themeColor="accent"
                    style={styles.stepNumber}
                  >
                    {s.n}
                  </BrandHeading>
                  <View style={styles.stepBody}>
                    <BrandHeading level="h3" style={styles.stepTitle}>
                      {s.title}
                    </BrandHeading>
                    <ThemedText type="default" themeColor="textSecondary">
                      {s.body}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.section,
              styles.foundingSection,
              {
                backgroundColor: theme.accentSoft,
              },
            ]}
          >
            <BrandHeading level="eyebrow" themeColor="accent">
              Founding 100
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              The first 100 families get a 30-minute parent session with our founding therapist.
            </BrandHeading>
            <ThemedText type="default" themeColor="text" style={styles.lead}>
              Real coaching from a licensed therapist, one-to-one, included
              with founding-family status. We can credibly only do this once —
              and only for the families who help us shape v1.
            </ThemedText>
            <BrandButton label="Get an invite" onPress={requestInvite} />
          </View>

          <View style={styles.section}>
            <BrandHeading level="eyebrow" themeColor="info">
              About the creator
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Erica Hospes, LMFT
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              Erica is a licensed therapist who works with ADHD families every
              week. Home Hero is the tool she wished existed for her own
              clients: clinical standards, in the home, without the parent
              doing all the work of being the standard.
            </ThemedText>
            <ThemedText type="small" themeColor="textMuted" style={styles.lead}>
              Bio in progress — final version coming soon.
            </ThemedText>
          </View>

          <View
            style={[
              styles.footer,
              { borderTopColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            <ThemedText type="small" themeColor="textMuted">
              © {new Date().getFullYear()} Home Hero. Made for the families
              already doing the hard part.
            </ThemedText>
            <View style={styles.footerLinks}>
              <Link
                href="/privacy"
                style={[styles.footerLink, { color: theme.textSecondary }]}
              >
                Privacy
              </Link>
              <ThemedText type="small" themeColor="textMuted">
                ·
              </ThemedText>
              <Link
                href="/terms"
                style={[styles.footerLink, { color: theme.textSecondary }]}
              >
                Terms
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    width: '100%',
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  navLink: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
  heroFootnote: {
    marginTop: Spacing.one,
  },
  wordmark: {
    letterSpacing: 0.5,
  },
  hero: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.four,
  },
  heroWide: {
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.eight,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  heroTitle: {
    marginTop: Spacing.one,
  },
  heroSub: {
    maxWidth: ReadableContentWidth,
    fontSize: 18,
    lineHeight: 28,
  },
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  section: {
    paddingVertical: Spacing.eight,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.lg,
    marginBottom: Spacing.five,
    gap: Spacing.three,
  },
  sectionTitle: {
    maxWidth: ReadableContentWidth,
  },
  lead: {
    maxWidth: ReadableContentWidth,
    fontSize: 17,
    lineHeight: 28,
  },
  pillarGrid: {
    flexDirection: 'column',
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  pillarGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pillarCard: {
    flex: 1,
    padding: Spacing.five,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  pillarTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  steps: {
    marginTop: Spacing.four,
    gap: Spacing.five,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.four,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  stepNumber: {
    fontSize: 28,
    lineHeight: 32,
    minWidth: 56,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.two,
  },
  stepTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  foundingSection: {
    alignItems: 'flex-start',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    marginTop: Spacing.four,
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'none',
  },

  // iOS chooser landing — stripped-down entry surface for the native app.
  // Goal: hero + 3 action buttons + tiny footer, all visible on a 4.7"
  // iPhone SE without scrolling. No marketing copy, no heatmap, no pillars.
  iosRoot: {
    flex: 1,
  },
  iosContainer: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    justifyContent: 'space-between',
  },
  iosHero: {
    alignItems: 'flex-start',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  iosHeroText: {
    gap: Spacing.two,
  },
  iosTitle: {
    marginTop: Spacing.one,
  },
  iosSub: {
    fontSize: 17,
    lineHeight: 26,
  },
  iosActions: {
    gap: Spacing.three,
  },
  iosFooter: {
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  iosInviteLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  iosLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iosLegalLink: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});
