import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { PhotoViewer } from '@/components/photo-viewer';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import {
  APPROVAL_REASONS,
  approvalReasonFor,
  REJECTION,
} from '@/lib/override-copy';
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
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const applyOverride = async (
    kind: 'approved' | 'rejected',
    reason: 'good_enough_today' | 'worked_hard' | 'help_with_rest' | null
  ) => {
    setOverrideBusy(true);
    setOverrideError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('apply_parent_override', {
        p_submission_id: params.id as string,
        p_override: kind,
        p_reason: reason,
      });
      if (rpcErr) throw rpcErr;
      await reload();
    } catch (err) {
      setOverrideError(
        err instanceof Error ? err.message : 'Could not save your decision.'
      );
    } finally {
      setOverrideBusy(false);
    }
  };

  const clearOverride = async () => {
    setOverrideBusy(true);
    setOverrideError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('clear_parent_override', {
        p_submission_id: params.id as string,
      });
      if (rpcErr) throw rpcErr;
      await reload();
    } catch (err) {
      setOverrideError(
        err instanceof Error ? err.message : 'Could not clear your decision.'
      );
    } finally {
      setOverrideBusy(false);
    }
  };

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
          Couldn’t find that submission.
        </ThemedText>
        <View style={{ height: Spacing.three }} />
        <BrandButton label="Back to dashboard" onPress={() => router.replace('/app')} />
      </View>
    );
  }

  const hasReference = chore?.reference_photo_path;
  const verdict = submission.ai_verdict;
  const feedback = submission.ai_feedback;
  const parentOverride = submission.parent_override;
  const parentOverrideReason = approvalReasonFor(submission.parent_override_reason);

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

          <Pressable
            onPress={() => signedUrl && setViewerOpen(true)}
            style={[
              styles.photoFrame,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {signedUrl ? (
              <>
                <Image
                  source={{ uri: signedUrl }}
                  style={styles.photo}
                  resizeMode="contain"
                />
                <View
                  style={[
                    styles.zoomHint,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap to enlarge
                  </ThemedText>
                </View>
              </>
            ) : urlError ? (
              <ThemedText type="small" style={{ color: '#B23A48', textAlign: 'center' }}>
                {urlError}
              </ThemedText>
            ) : (
              <ThemedText type="default" themeColor="textMuted">
                Loading photo…
              </ThemedText>
            )}
          </Pressable>

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

          {/* Parent override — always available, regardless of AI verdict */}
          <View
            style={[
              styles.overrideCard,
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
              Your call
            </ThemedText>

            {parentOverride === 'approved' && parentOverrideReason ? (
              <>
                <BrandHeading level="h2" style={{ marginBottom: Spacing.one }}>
                  {parentOverrideReason.emoji} You said: {parentOverrideReason.parentLabel}
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={{ lineHeight: 26 }}
                >
                  {kid?.display_name ?? 'They'} will see:{' '}
                  <ThemedText type="default" style={{ fontStyle: 'italic' }}>
                    “{parentOverrideReason.kidMessage}”
                  </ThemedText>
                </ThemedText>
                {submission.parent_override_at && (
                  <ThemedText type="small" themeColor="textMuted">
                    Decided{' '}
                    {new Date(submission.parent_override_at).toLocaleString(
                      undefined,
                      {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }
                    )}
                  </ThemedText>
                )}
                <Pressable
                  onPress={clearOverride}
                  disabled={overrideBusy}
                  hitSlop={6}
                >
                  <ThemedText
                    type="small"
                    themeColor="info"
                    style={{ textDecorationLine: 'underline' }}
                  >
                    {overrideBusy ? 'Clearing…' : 'Change my mind'}
                  </ThemedText>
                </Pressable>
              </>
            ) : parentOverride === 'rejected' ? (
              <>
                <BrandHeading level="h2" style={{ marginBottom: Spacing.one }}>
                  {REJECTION.emoji} You said: {REJECTION.parentLabel}
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={{ lineHeight: 26 }}
                >
                  {kid?.display_name ?? 'They'} will see:{' '}
                  <ThemedText type="default" style={{ fontStyle: 'italic' }}>
                    “{REJECTION.kidMessage}”
                  </ThemedText>
                </ThemedText>
                {submission.parent_override_at && (
                  <ThemedText type="small" themeColor="textMuted">
                    Decided{' '}
                    {new Date(submission.parent_override_at).toLocaleString(
                      undefined,
                      {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }
                    )}
                  </ThemedText>
                )}
                <Pressable
                  onPress={clearOverride}
                  disabled={overrideBusy}
                  hitSlop={6}
                >
                  <ThemedText
                    type="small"
                    themeColor="info"
                    style={{ textDecorationLine: 'underline' }}
                  >
                    {overrideBusy ? 'Clearing…' : 'Change my mind'}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <BrandHeading level="h2" style={{ marginBottom: Spacing.one }}>
                  What do you want {kid?.display_name ?? 'them'} to hear?
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={{ lineHeight: 26 }}
                >
                  Your call lands on {kid?.display_name ?? 'their'} chore tile
                  the next time they open the app. It also counts toward their
                  rewards.
                </ThemedText>

                <View style={styles.overrideBtnGrid}>
                  {APPROVAL_REASONS.map((r) => (
                    <Pressable
                      key={r.value}
                      onPress={() => applyOverride('approved', r.value)}
                      disabled={overrideBusy}
                      style={({ pressed }) => [
                        styles.overrideBtn,
                        {
                          backgroundColor: pressed
                            ? theme.accent
                            : theme.accentSoft,
                          borderColor: theme.accent,
                          opacity: overrideBusy ? 0.6 : 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="default"
                        style={{
                          fontSize: 22,
                          marginRight: Spacing.one,
                        }}
                      >
                        {r.emoji}
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={{ color: theme.text }}
                      >
                        {r.parentLabel}
                      </ThemedText>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => applyOverride('rejected', null)}
                    disabled={overrideBusy}
                    style={({ pressed }) => [
                      styles.overrideBtn,
                      {
                        backgroundColor: pressed ? '#F3DDD8' : theme.background,
                        borderColor: '#D6A89E',
                        opacity: overrideBusy ? 0.6 : 1,
                      },
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={{ fontSize: 22, marginRight: Spacing.one }}
                    >
                      {REJECTION.emoji}
                    </ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.text }}>
                      {REJECTION.parentLabel}
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}

            {overrideError && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {overrideError}
              </ThemedText>
            )}
          </View>
        </View>
      </SafeAreaView>

      <PhotoViewer
        visible={viewerOpen}
        uri={signedUrl}
        alt={`${kid?.display_name ?? 'Kid'} submission for ${chore?.title ?? 'chore'}`}
        onClose={() => setViewerOpen(false)}
      />
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
    padding: Spacing.two,
  },
  photo: { width: '100%', height: '100%' },
  zoomHint: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  aiCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  overrideCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  overrideBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
