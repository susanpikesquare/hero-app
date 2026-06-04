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

// TestFlight public link. Set this when Susan enables it in App Store
// Connect → Apps → Home Hero Family → TestFlight → (group) → Public Link.
// When empty, the "Get the app" CTAs route to the invite-request mailto
// instead.
const TESTFLIGHT_URL = '';

const PILLARS = [
  {
    title: 'A shared standard, not a parent\'s voice.',
    body: 'A reference photo and a few tips define what "done" looks like, so the standard lives on the app instead of in any one person\'s tone.',
  },
  {
    title: 'Less nagging, more nervous-system rest.',
    body: 'The app carries the daily managing. The parent gets back the attention to be present.',
  },
  {
    title: 'Connection over correction.',
    body: 'Feedback is always encouragement-first, specific, and never shaming. Built for harmony, peace, and joy, not productivity.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Set the standard.',
    body: 'Start from a starter task drawn from published developmental guidance, or create your own. Add a reference photo and a few tips so "done" is visible, not negotiable.',
  },
  {
    n: '02',
    title: 'Your kid submits.',
    body: 'A photo of their finished work — or a simple mark-complete for tasks like brushing teeth. The AI gives kind, specific feedback and routes anything ambiguous to you.',
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
              AI-validated chores. Less nagging, more presence.
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
              href="/guide"
              style={[styles.iosLegalLink, { color: theme.textMuted }]}
            >
              How it works
            </Link>
            <ThemedText type="small" themeColor="textMuted">
              ·
            </ThemedText>
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
  // The "is this for you" mirror — Erica's June 3 ask. This is the
  // front-door experience for a curious parent. Routed from the hero
  // and the Founding-100 section so prospects move through the mirror
  // before being asked to commit.
  const goToAssessment = () => router.push('/assessment');
  // The app is primarily phone-based. Web is the home base for parent
  // setup + heatmap review. When a TestFlight public link is
  // configured, "Get the app" deep-links there; otherwise it falls
  // back to the invite-request mailto.
  const getTheApp = () => {
    if (TESTFLIGHT_URL) {
      Linking.openURL(TESTFLIGHT_URL);
    } else {
      requestInvite();
    }
  };
  const installCtaLabel = TESTFLIGHT_URL
    ? 'Get Home Hero on iPhone'
    : 'Request iPhone access';

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
                label={installCtaLabel}
                onPress={getTheApp}
              />
            </View>
          </View>

          <View style={[styles.hero, isWide && styles.heroWide]}>
            <BrandHeading level="eyebrow" themeColor="accent">
              For every family · harmony, peace, joy
            </BrandHeading>
            <BrandHeading
              level={isWide ? 'display' : 'h1'}
              style={styles.heroTitle}
            >
              A family operating system in your pocket.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.heroSub}
            >
              Home Hero is primarily an iPhone app. The kid uses it on
              their device; you set the standards and review on yours.
              The web (this site, when you sign in) is the home base for
              setup and the longer view. Both surfaces, one family.
            </ThemedText>
            <View style={styles.heroCTA}>
              <BrandButton
                label="Is this for you? 30-second self-check →"
                onPress={goToAssessment}
              />
              <BrandButton
                variant="ghost"
                label={installCtaLabel}
                onPress={getTheApp}
              />
            </View>
            <View style={styles.heroSubCTA}>
              <Pressable onPress={goToSignup} hitSlop={6}>
                <ThemedText
                  type="small"
                  style={[styles.heroSubLink, { color: theme.info }]}
                >
                  Already have a code? Sign in on web →
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText type="small" themeColor="textMuted" style={styles.heroFootnote}>
              Invite-only while we work with our first cohort of families. The self-check is for you, not us — there's no scoring on the other end.
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

          {/* App download / surface explainer. Comes right after "Why a
              chore app" so the reader has the value frame, before
              "How it works" gets into mechanics. */}
          <View
            style={[
              styles.section,
              styles.installSection,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <BrandHeading level="eyebrow" themeColor="accent">
              The app
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Built for the phone you already have in your hand.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              Home Hero is primarily an iPhone app. Your kid uses it on
              their device or a shared family one; you use it on yours.
              The web (this site, when you sign in) is the home base for
              the longer view — adding kids, picking the standard, reading
              the heatmap with a coffee in your hand. Two surfaces, one
              family operating system.
            </ThemedText>
            <View style={styles.installRow}>
              <BrandButton label={installCtaLabel} onPress={getTheApp} />
              <BrandButton
                variant="ghost"
                label="Open on web →"
                onPress={goToSignup}
              />
            </View>
            <ThemedText
              type="small"
              themeColor="textMuted"
              style={styles.heroFootnote}
            >
              iPhone for now. Android is on the roadmap once the iOS loop
              is proven.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <BrandHeading level="eyebrow" themeColor="accent">
              How it works
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Three steps. One bedroom to start.
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              v0 starts with the single hardest chore in most homes:
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
              The first 100 families get a 30-minute working session with Erica, our founder.
            </BrandHeading>
            <ThemedText type="default" themeColor="text" style={styles.lead}>
              A one-to-one conversation with Erica, included with
              founding-family status. A chance to talk through how your
              family is using the app and what we should build next. We can
              credibly only do this once, and only for the families who help
              us shape v1.
            </ThemedText>
            <View style={styles.heroCTA}>
              <BrandButton
                label="See if it's a fit"
                onPress={goToAssessment}
              />
              <BrandButton
                variant="ghost"
                label="Email us directly"
                onPress={requestInvite}
              />
            </View>
          </View>

          <View style={styles.section}>
            <BrandHeading level="eyebrow" themeColor="info">
              About the founder
            </BrandHeading>
            <BrandHeading level="h2" style={styles.sectionTitle}>
              Erica Hospes, LMFT
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary" style={styles.lead}>
              Erica founded Home Hero out of her own experience as a parent
              and her years in private practice. The framework that runs
              underneath every screen — the voice, the language, the
              developmental fit by age — came out of her conviction that no
              parent should have to be the family's standard alone.
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
                href="/guide"
                style={[styles.footerLink, { color: theme.textSecondary }]}
              >
                How it works
              </Link>
              <ThemedText type="small" themeColor="textMuted">
                ·
              </ThemedText>
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
  heroSubCTA: {
    marginTop: Spacing.two,
  },
  heroSubLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  installSection: {
    borderWidth: 1,
  },
  installRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.three,
    flexWrap: 'wrap',
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
