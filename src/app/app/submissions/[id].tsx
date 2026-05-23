import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
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
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

export default function SubmissionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { kids } = useFamily(!!session);
  const { submissions, chores, loading, reload } = useChores(!!session);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const submission = submissions.find((s) => s.id === params.id);
  const chore = submission ? chores.find((c) => c.id === submission.chore_id) : null;
  const kid = submission
    ? kids.find((k) => k.id === submission.submitted_by)
    : null;

  // Load signed URL for the kid's submission photo.
  useEffect(() => {
    let cancelled = false;
    if (!submission?.photo_path) return;
    supabase.storage
      .from('submissions')
      .createSignedUrl(submission.photo_path, 60 * 10)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setUrlError(error.message);
          return;
        }
        setSignedUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [submission?.photo_path]);

  // Poll for AI eval result while it's still pending and the submission
  // is recent (don't poll forever on old submissions where the eval failed).
  const aiPending = submission && !submission.ai_evaluated_at;
  const submittedAt = submission ? new Date(submission.submitted_at).getTime() : 0;
  const recentEnough = Date.now() - submittedAt < 90 * 1000;
  useEffect(() => {
    if (!aiPending || !recentEnough) return;
    const id = setInterval(() => reload(), 3000);
    return () => clearInterval(id);
  }, [aiPending, recentEnough, reload]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading submission…
        </ThemedText>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Couldn&rsquo;t find that submission.
        </ThemedText>
        <View style={{ height: Spacing.three }} />
        <BrandButton label="Back to dashboard" onPress={() => router.replace('/app')} />
      </View>
    );
  }

  const hasReference = chore?.reference_photo_path;
  const verdict = submission.ai_verdict;
  const feedback = submission.ai_feedback;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={96} />
            <BrandButton
              variant="ghost"
              label="← Dashboard"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              Submission
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {kid?.display_name ?? 'A kid'} — {chore?.title ?? 'a chore'}
            </BrandHeading>
            <ThemedText type="small" themeColor="textSecondary">
              Submitted{' '}
              {new Date(submission.submitted_at).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>

          <View
            style={[
              styles.photoFrame,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {signedUrl ? (
              <Image
                source={{ uri: signedUrl }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : urlError ? (
              <ThemedText type="small" style={{ color: '#B23A48', textAlign: 'center' }}>
                {urlError}
              </ThemedText>
            ) : (
              <ThemedText type="default" themeColor="textMuted">
                Loading photo…
              </ThemedText>
            )}
          </View>

          {!hasReference ? (
            <AiCard
              theme={theme}
              tone="info"
              eyebrow="AI review"
              title="Add a reference photo to enable AI review."
              body={`We need to know what a finished ${chore?.title.toLowerCase() ?? 'chore'} looks like before the AI can grade ${kid?.display_name ?? "your kid's"} photo.`}
              action={
                chore && (
                  <BrandButton
                    label="Set the reference photo"
                    onPress={() => router.push(`/app/chores/${chore.id}`)}
                  />
                )
              }
            />
          ) : verdict ? (
            <AiCard
              theme={theme}
              tone={verdict === 'pass' ? 'pass' : 'needs_work'}
              eyebrow={verdict === 'pass' ? 'AI says: looks great' : 'AI says: almost there'}
              title={verdict === 'pass' ? '✓ Pass' : 'Not quite there yet'}
              body={feedback ?? 'No feedback returned.'}
              meta={
                submission.ai_evaluated_at
                  ? `Evaluated ${new Date(submission.ai_evaluated_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : null
              }
            />
          ) : aiPending && recentEnough ? (
            <AiCard
              theme={theme}
              tone="info"
              eyebrow="AI review"
              title="Evaluating photo…"
              body="The AI is comparing this photo to the reference. This usually takes a few seconds."
            />
          ) : (
            <AiCard
              theme={theme}
              tone="info"
              eyebrow="AI review"
              title="No AI verdict yet."
              body="The evaluator hasn't responded. You can review the photo manually, or reload to retry."
              action={
                <BrandButton variant="ghost" label="Reload" onPress={() => reload()} />
              }
            />
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function AiCard({
  theme,
  tone,
  eyebrow,
  title,
  body,
  meta,
  action,
}: {
  theme: ReturnType<typeof useTheme>;
  tone: 'info' | 'pass' | 'needs_work';
  eyebrow: string;
  title: string;
  body: string;
  meta?: string | null;
  action?: React.ReactNode;
}) {
  const bg =
    tone === 'pass'
      ? theme.accentSoft
      : tone === 'needs_work'
        ? '#F3E8D6'
        : theme.infoSoft;
  const accent =
    tone === 'pass'
      ? theme.accent
      : tone === 'needs_work'
        ? '#8A5A1F'
        : theme.info;
  return (
    <View
      style={[
        styles.aiCard,
        { backgroundColor: bg, borderColor: theme.border },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{ color: accent, textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {eyebrow}
      </ThemedText>
      <BrandHeading level="h2" style={{ marginBottom: Spacing.one }}>
        {title}
      </BrandHeading>
      <ThemedText type="default" themeColor="text" style={{ lineHeight: 26 }}>
        {body}
      </ThemedText>
      {meta && (
        <ThemedText type="small" themeColor="textMuted">
          {meta}
        </ThemedText>
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
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
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth },
  title: { marginTop: Spacing.one },
  photoFrame: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  aiCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.two,
  },
});
