import { Link, useRouter } from 'expo-router';
import {
  Image,
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
    : 'Join the Beta';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          {/* Compact nav. Uncorkd-style: small wordmark on the left,
              tight links on the right. The big CTA lives in the hero,
              not the nav. */}
          <View style={styles.nav}>
            <BrandLogo height={isWide ? 56 : 44} />
            <View style={styles.navActions}>
              <Link
                href="/guide"
                style={[styles.navLink, { color: theme.textSecondary }]}
              >
                How it works
              </Link>
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
            </View>
          </View>

          {/* Hero — two-column on wide, stacked on narrow.
              LEFT: eyebrow, headline, sub, CTAs, fine print.
              RIGHT: large rounded app icon.
              Modeled on uncorkdwine.app's hero shape (per Susan QA). */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View
              style={[
                styles.heroText,
                isWide && styles.heroTextWide,
              ]}
            >
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
                Home Hero is primarily an iPhone app. Your kid uses it on
                their device; you set the standards and review on yours.
                Sign in on the web (here) for setup and the longer view.
              </ThemedText>
              <View style={styles.heroCTA}>
                <BrandButton
                  label={installCtaLabel}
                  onPress={getTheApp}
                />
                <BrandButton
                  variant="ghost"
                  label="Is this for you?"
                  onPress={goToAssessment}
                />
              </View>
              <View style={styles.heroSubCTA}>
                <Pressable onPress={goToSignup} hitSlop={6}>
                  <ThemedText
                    type="small"
                    style={[styles.heroSubLink, { color: theme.info }]}
                  >
                    I have a code · sign in →
                  </ThemedText>
                </Pressable>
              </View>
              <ThemedText
                type="small"
                themeColor="textMuted"
                style={styles.heroFootnote}
              >
                Invite-only while we work with our first cohort. For
                families with kids ages 4–18.
              </ThemedText>
            </View>

            <View
              style={[
                styles.heroIconWrap,
                isWide && styles.heroIconWrapWide,
              ]}
            >
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('@/assets/images/icon.png')}
                accessible
                accessibilityLabel="Home Hero — the iPhone app icon"
                style={styles.heroIcon}
                resizeMode="contain"
              />
            </View>
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
            <View
              style={[
                styles.founderRow,
                isWide && styles.founderRowWide,
              ]}
            >
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('@/assets/images/erica_hospes.png')}
                accessible
                accessibilityLabel="Erica Hospes, LMFT — founder of Home Hero"
                style={[
                  styles.founderPhoto,
                  { borderColor: theme.border },
                ]}
                resizeMode="cover"
              />
              <View style={styles.founderBio}>
                <ThemedText type="default" themeColor="text" style={styles.lead}>
                  Erica founded Home Hero out of her years in private practice
                  and her own experience as a parent. She is a Licensed
                  Marriage and Family Therapist with a doctorate in human
                  sexuality and a master's in transpersonal psychology, and
                  the founder of The Creation Agency in Los Gatos, where her
                  practice has long focused on adolescent development and
                  parental support.
                </ThemedText>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={styles.lead}
                >
                  Before therapy, she spent a decade in the technology
                  industry — which is part of why Home Hero exists at all.
                  The framework that runs underneath every screen came out
                  of what she has seen sitting with families: the moves
                  that actually help, and the gaps that no app on the
                  market was filling.
                </ThemedText>
              </View>
            </View>
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
  founderRow: {
    flexDirection: 'column',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  founderRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  founderPhoto: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  founderBio: {
    flex: 1,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth,
  },
  wordmark: {
    letterSpacing: 0.5,
  },
  hero: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.six,
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroWide: {
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.eight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.eight,
  },
  heroText: {
    gap: Spacing.four,
    flex: 1,
    width: '100%',
  },
  heroTextWide: {
    maxWidth: ReadableContentWidth + Spacing.four,
  },
  heroIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroIconWrapWide: {
    flex: 1,
    width: 'auto',
    maxWidth: 480,
  },
  heroIcon: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 380,
    // Soft drop shadow so the icon reads as an object floating on the page
    // (matches the Uncorkd hero treatment).
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
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
    gap: Spacing.three,
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
