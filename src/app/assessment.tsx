/**
 * Pre-signup self-assessment.
 *
 * Per Erica's June 3 working session: a short mirror — "are you
 * experiencing these things? are you wanting these things?" — that
 * meets the parent where they are before asking them to sign up.
 *
 * NOT a gate. The parent's answers are recorded (analytics + a local
 * stash so they get carried into signup) but the parent always gets the
 * same next step: "Let's start." We treat the assessment as honoring
 * their arrival, not vetting their fitness.
 *
 * Flow:
 *   /assessment → page 1 (experiencing) → page 2 (wanting) →
 *   /assessment/complete → /signup
 *
 * Page navigation is in-component state, not separate routes — keeps
 * answers in memory without a routing/storage hop in the middle.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
import {
  ASSESSMENT_PAGES,
  scoreAssessment,
  type AssessmentAnswer,
  type AssessmentResult,
} from '@/lib/assessment-questions';

// Mailto wiring for the "Request an invite" outcome. Keep in sync with
// landing page (src/app/index.tsx).
const INVITE_EMAIL = 'susan@pikesquare.co';
const INVITE_SUBJECT = 'Home Hero — invite request';
const INVITE_BODY_BASE =
  "Hi,\n\nI just took the Home Hero self-check. A bit about my family:\n\n— ";

const ANSWERS: { value: AssessmentAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'no', label: 'No' },
];

/**
 * Stash answers in localStorage on web (and skip on native — we can wire
 * AsyncStorage later if we want to carry results across native sessions).
 * Used so a parent who closes the tab can come back without re-doing.
 */
const STORAGE_KEY = 'home-hero.assessment-v1';

function loadStored(): AssessmentResult {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AssessmentResult;
  } catch {
    return {};
  }
}

function persist(result: AssessmentResult) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // best effort
  }
}

type Step = 'questions' | 'complete';

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('questions');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<AssessmentResult>(() => loadStored());

  const page = ASSESSMENT_PAGES[pageIndex];
  const isLastPage = pageIndex === ASSESSMENT_PAGES.length - 1;
  const allAnswered = useMemo(
    () => page.questions.every((q) => !!result[q.id]),
    [page.questions, result]
  );

  const setAnswer = (questionId: string, value: AssessmentAnswer) => {
    const next = { ...result, [questionId]: value };
    setResult(next);
    persist(next);
  };

  const onContinue = () => {
    if (isLastPage) {
      // Record + advance to the completion step. No score-gating; we
      // honor the parent's arrival regardless of how they answered.
      // eslint-disable-next-line no-console
      console.info(
        '[assessment] complete',
        scoreAssessment(result),
        '/',
        Object.keys(result).length
      );
      setStep('complete');
      return;
    }
    setPageIndex((i) => i + 1);
  };

  const onSkip = () => {
    // Honor "I just want to start." Skip goes back to landing — the
    // assessment is a mirror, not a step on the way to signup. From
    // landing they can grab "I have a code" or "Get an invite" as they
    // already could.
    router.replace('/');
  };

  if (step === 'complete') {
    return (
      <CompletionStep
        result={result}
        onRequestInvite={() => {
          const subject = encodeURIComponent(INVITE_SUBJECT);
          const body = encodeURIComponent(INVITE_BODY_BASE);
          Linking.openURL(
            `mailto:${INVITE_EMAIL}?subject=${subject}&body=${body}`
          );
        }}
        onHaveCode={() => router.replace('/signup')}
        onBack={() => setStep('questions')}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={56} />
            <Pressable onPress={onSkip} hitSlop={8}>
              <ThemedText
                type="smallBold"
                style={{ color: theme.textSecondary }}
              >
                Skip →
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {page.eyebrow}
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {page.title}
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              {page.lead}
            </ThemedText>
          </View>

          <View style={styles.questions}>
            {page.questions.map((q) => (
              <View
                key={q.id}
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="default"
                  themeColor="text"
                  style={styles.questionText}
                >
                  {q.text}
                </ThemedText>
                <View style={styles.answerRow}>
                  {ANSWERS.map((a) => {
                    const isActive = result[q.id] === a.value;
                    return (
                      <Pressable
                        key={a.value}
                        onPress={() => setAnswer(q.id, a.value)}
                        style={({ pressed }) => [
                          styles.answerChip,
                          {
                            borderColor: isActive ? theme.accent : theme.border,
                            backgroundColor: isActive
                              ? theme.accentSoft
                              : pressed
                                ? theme.backgroundSelected
                                : theme.background,
                          },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: isActive ? theme.accent : theme.text,
                          }}
                        >
                          {a.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <BrandButton
              label={isLastPage ? 'Continue to sign up' : 'Next'}
              onPress={onContinue}
              disabled={!allAnswered}
            />
            {pageIndex > 0 && (
              <BrandButton
                variant="ghost"
                label="Back"
                onPress={() => setPageIndex((i) => Math.max(0, i - 1))}
              />
            )}
          </View>

          <ThemedText
            type="small"
            themeColor="textMuted"
            style={styles.footer}
          >
            Not sure yet?{' '}
            <ThemedText
              type="small"
              style={{ color: theme.info, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('/guide')}
            >
              Read how it works
            </ThemedText>{' '}
            first.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

/**
 * Completion step shown after both pages are answered. Honors the
 * parent's arrival with a thoughtful framing keyed to how they scored,
 * then offers two paths:
 *   - "Request an invite" → opens a pre-filled mailto so they can send
 *     a few words about their family.
 *   - "I already have a code" → /signup.
 *
 * Tone rule: we never tell them they "failed" the assessment, ever.
 * A low score means the product may not be a fit yet — we say that
 * gently, with an open door.
 */
function CompletionStep({
  result,
  onRequestInvite,
  onHaveCode,
  onBack,
}: {
  result: AssessmentResult;
  onRequestInvite: () => void;
  onHaveCode: () => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  const score = scoreAssessment(result);
  // Max possible = 12 (6 questions × 2 points for "yes"). The cutoffs
  // are deliberately wide; we'd rather greet a low-scoring parent with
  // warmth than gate them out.
  const tier: 'high' | 'mid' | 'low' =
    score >= 8 ? 'high' : score >= 4 ? 'mid' : 'low';

  const tierCopy = {
    high: {
      eyebrow: 'Sounds like a fit',
      title: 'This was built for the home you just described.',
      body:
        "What you just named — the running, the load, the distance — is the exact ground Home Hero was built on. If you'd like an invite, we'd love to have you in our founding cohort.",
    },
    mid: {
      eyebrow: 'Could be a fit',
      title: 'Some of this is yours, some maybe not.',
      body:
        "You're carrying some of what Home Hero is built to lift. Most of our founding families look like this on day one — a few clear yeses, a few sometimeses, a few nos. If any of it is enough that you'd like to try, we'd be glad to have you.",
    },
    low: {
      eyebrow: 'Maybe not yet',
      title: "Sounds like things are okay where you are.",
      body:
        "We built Home Hero for parents who are quietly carrying too much. If that's not where you are right now, the app may be more than you need today — and that's a good thing. You're welcome to look around. If something changes, come back any time.",
    },
  }[tier];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={56} />
            <Pressable onPress={onBack} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                ← Edit answers
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {tierCopy.eyebrow}
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {tierCopy.title}
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              {tierCopy.body}
            </ThemedText>
          </View>

          {/* Two paths. Order matters — for high/mid, lead with invite;
              for low, lead with "look around" via /guide and demote
              both action buttons to ghosts. */}
          <View style={completionStyles.outcomes}>
            {tier !== 'low' && (
              <View
                style={[
                  completionStyles.outcomeCard,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  New here
                </ThemedText>
                <BrandHeading level="h3" style={completionStyles.outcomeTitle}>
                  Request an invite
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={completionStyles.outcomeBody}
                >
                  Founding-100 families also get a 30-minute working
                  session with our founding consultant. Send us a short
                  note about your family and we'll send you a code.
                </ThemedText>
                <BrandButton
                  label="Email us for an invite →"
                  onPress={onRequestInvite}
                />
              </View>
            )}

            <View
              style={[
                completionStyles.outcomeCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText
                type="smallBold"
                themeColor="info"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Already invited
              </ThemedText>
              <BrandHeading level="h3" style={completionStyles.outcomeTitle}>
                I have a code
              </BrandHeading>
              <ThemedText
                type="default"
                themeColor="textSecondary"
                style={completionStyles.outcomeBody}
              >
                Skip the wait — head straight to signup with the invite
                code you were sent.
              </ThemedText>
              <BrandButton
                variant={tier === 'low' ? 'primary' : 'ghost'}
                label="Continue to signup →"
                onPress={onHaveCode}
              />
            </View>

            {tier === 'low' && (
              <View
                style={[
                  completionStyles.outcomeCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor="info"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Just looking
                </ThemedText>
                <BrandHeading level="h3" style={completionStyles.outcomeTitle}>
                  Read how it works
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={completionStyles.outcomeBody}
                >
                  No pressure. Browse the guide if you're curious — you
                  can always come back later.
                </ThemedText>
                <BrandButton
                  variant="ghost"
                  label="Read the guide →"
                  onPress={() => Linking.openURL('/guide')}
                />
              </View>
            )}
          </View>

          <ThemedText type="small" themeColor="textMuted" style={styles.footer}>
            Your answers stay on your device. There's no scoring on the
            other end — this was for you, not us.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const completionStyles = StyleSheet.create({
  outcomes: {
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  outcomeCard: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  outcomeTitle: { marginTop: Spacing.one },
  outcomeBody: { fontSize: 16, lineHeight: 26 },
});

const styles = StyleSheet.create({
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
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  title: { marginTop: Spacing.one },
  lead: {
    fontSize: 17,
    lineHeight: 28,
    maxWidth: ReadableContentWidth,
  },
  questions: { gap: Spacing.four },
  questionCard: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  questionText: { fontSize: 17, lineHeight: 26 },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  answerChip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  footer: { marginTop: Spacing.three, maxWidth: ReadableContentWidth },
});
