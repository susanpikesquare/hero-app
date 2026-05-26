/**
 * iOS parent queue view — the "what needs my call right now" screen.
 *
 * Rendered as the /app home on iOS (web keeps the dashboard). The job is
 * narrow: surface every submission that hasn't been decided yet, in a
 * stack of large cards, and let the parent decide each one in a single
 * tap using Erica's encouragement-first reason buttons.
 *
 * On the same card the parent can also tap the photo to enlarge it, see
 * the AI verdict + feedback when available, and read who/what/when.
 *
 * Empty state celebrates being caught up. A persistent "Dashboard" button
 * in the nav lets the parent break out of the queue when they want the
 * fuller view (the same view web sees by default).
 */

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
import { APPROVAL_REASONS, REJECTION } from '@/lib/override-copy';
import { supabase } from '@/lib/supabase';
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';
import { useOverride } from '@/lib/use-override';

type SignedUrlMap = Record<string, string | null>;

export function ParentQueueView() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { family, kids, loading: famLoading } = useFamily(!!session);
  const {
    chores,
    submissions,
    loading: choresLoading,
    reload,
  } = useChores(!!session);
  const { apply, busy, error: overrideError } = useOverride();

  // Pending submissions, newest first.
  const pending = useMemo(
    () =>
      submissions
        .filter((s) => !s.parent_override)
        .sort(
          (a, b) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime()
        ),
    [submissions]
  );

  // Signed URLs for the photos, fetched in one batch per pending list change.
  const [signedUrls, setSignedUrls] = useState<SignedUrlMap>({});
  useEffect(() => {
    if (pending.length === 0) {
      setSignedUrls({});
      return;
    }
    let cancelled = false;
    // Self-care (checklist) submissions have a NULL photo_path — filter
    // them out so we don't ask Supabase to sign a non-existent path.
    const paths = pending
      .map((p) => p.photo_path)
      .filter((p): p is string => p !== null);
    supabase.storage
      .from('submissions')
      .createSignedUrls(paths, 60 * 10)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: SignedUrlMap = {};
        for (const row of data) {
          next[row.path ?? ''] = row.signedUrl ?? null;
        }
        setSignedUrls(next);
      });
    return () => {
      cancelled = true;
    };
  }, [pending]);

  const onSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (famLoading || choresLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
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
          <View style={styles.nav}>
            <BrandLogo height={72} />
            <View style={styles.navActions}>
              <BrandButton
                variant="ghost"
                label="Dashboard"
                onPress={() => router.push('/app/dashboard')}
              />
              <BrandButton variant="ghost" label="Sign out" onPress={onSignOut} />
            </View>
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {family?.name ?? 'Your family'} · Review queue
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {pending.length === 0
                ? 'You’re all caught up.'
                : pending.length === 1
                  ? '1 submission to review'
                  : `${pending.length} submissions to review`}
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              {pending.length === 0
                ? 'No new chores to call. Tap Dashboard for the fuller view.'
                : 'Tap a card to enlarge the photo. Pick a reason to land your call — your kid sees the message you choose.'}
            </ThemedText>
          </View>

          {overrideError && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {overrideError}
            </ThemedText>
          )}

          {pending.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText
                type="default"
                style={{ fontSize: 56, textAlign: 'center' }}
              >
                ✨
              </ThemedText>
              <BrandHeading level="h2" style={{ textAlign: 'center' }}>
                Caught up
              </BrandHeading>
              <ThemedText
                type="default"
                themeColor="textSecondary"
                style={{ textAlign: 'center' }}
              >
                When your kids submit photos, they’ll show up here for a one-tap
                decision.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.cards}>
              {pending.map((sub) => {
                const chore = chores.find((c) => c.id === sub.chore_id);
                const kid = kids.find((k) => k.id === sub.submitted_by);
                const signedUrl = sub.photo_path ? signedUrls[sub.photo_path] : null;
                return (
                  <QueueCard
                    key={sub.id}
                    theme={theme}
                    kidName={kid?.display_name ?? 'A kid'}
                    choreTitle={chore?.title ?? 'A chore'}
                    submittedAt={sub.submitted_at}
                    aiVerdict={sub.ai_verdict}
                    aiFeedback={sub.ai_feedback}
                    signedUrl={signedUrl}
                    busy={busy}
                    onApprove={async (reason) => {
                      const ok = await apply(sub.id, 'approved', reason);
                      if (ok) await reload();
                    }}
                    onReject={async () => {
                      const ok = await apply(sub.id, 'rejected', null);
                      if (ok) await reload();
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function QueueCard({
  theme,
  kidName,
  choreTitle,
  submittedAt,
  aiVerdict,
  aiFeedback,
  signedUrl,
  busy,
  onApprove,
  onReject,
}: {
  theme: ReturnType<typeof useTheme>;
  kidName: string;
  choreTitle: string;
  submittedAt: string;
  aiVerdict: 'pass' | 'needs_work' | null;
  aiFeedback: string | null;
  signedUrl: string | null | undefined;
  busy: boolean;
  onApprove: (
    reason: 'good_enough_today' | 'worked_hard' | 'help_with_rest'
  ) => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const verdictBg =
    aiVerdict === 'pass'
      ? theme.accentSoft
      : aiVerdict === 'needs_work'
        ? '#F3E8D6'
        : theme.backgroundElement;
  const verdictFg =
    aiVerdict === 'pass'
      ? theme.accent
      : aiVerdict === 'needs_work'
        ? '#8A5A1F'
        : theme.textSecondary;
  const verdictLabel =
    aiVerdict === 'pass'
      ? 'AI: pass'
      : aiVerdict === 'needs_work'
        ? 'AI: needs work'
        : 'AI: pending';

  const timeAgo = (() => {
    const ms = Date.now() - new Date(submittedAt).getTime();
    const m = Math.round(ms / 60_000);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
  })();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <Pressable
        onPress={() => signedUrl && setViewerOpen(true)}
        style={[
          styles.photoFrame,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
      >
        {signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.photo}
            resizeMode="contain"
          />
        ) : (
          <ThemedText type="default" themeColor="textMuted">
            Loading photo…
          </ThemedText>
        )}
        {signedUrl && (
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
        )}
      </Pressable>

      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <BrandHeading level="h2" style={styles.cardTitle}>
            {kidName} · {choreTitle}
          </BrandHeading>
          <ThemedText type="small" themeColor="textMuted">
            Submitted {timeAgo}
          </ThemedText>
        </View>
        <View
          style={[
            styles.verdictChip,
            { backgroundColor: verdictBg, borderColor: theme.border },
          ]}
        >
          <ThemedText type="smallBold" style={{ color: verdictFg }}>
            {verdictLabel}
          </ThemedText>
        </View>
      </View>

      {aiFeedback && (
        <ThemedText
          type="default"
          themeColor="textSecondary"
          style={{ fontStyle: 'italic', lineHeight: 22 }}
        >
          “{aiFeedback}”
        </ThemedText>
      )}

      <View style={styles.actionsHeader}>
        <ThemedText
          type="smallBold"
          themeColor="accent"
          style={{ textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Your call
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {APPROVAL_REASONS.map((r) => (
          <Pressable
            key={r.value}
            onPress={() => onApprove(r.value)}
            disabled={busy}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: pressed ? theme.accent : theme.accentSoft,
                borderColor: theme.accent,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <ThemedText type="default" style={styles.actionEmoji}>
              {r.emoji}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              {r.parentLabel}
            </ThemedText>
          </Pressable>
        ))}
        <Pressable
          onPress={onReject}
          disabled={busy}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pressed ? '#F3DDD8' : theme.background,
              borderColor: '#D6A89E',
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          <ThemedText type="default" style={styles.actionEmoji}>
            {REJECTION.emoji}
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.text }}>
            {REJECTION.parentLabel}
          </ThemedText>
        </Pressable>
      </View>

      <PhotoViewer
        visible={viewerOpen}
        uri={signedUrl ?? null}
        alt={`${kidName}'s ${choreTitle} submission`}
        onClose={() => setViewerOpen(false)}
      />
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
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  header: {
    gap: Spacing.two,
    maxWidth: ReadableContentWidth + Spacing.seven,
  },
  title: { marginTop: Spacing.one },
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },
  emptyCard: {
    padding: Spacing.six,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    alignItems: 'center',
  },
  cards: { gap: Spacing.four },
  card: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  photoFrame: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  cardTitle: { marginBottom: 2 },
  verdictChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionsHeader: { marginTop: Spacing.one },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionEmoji: { fontSize: 22, marginRight: Spacing.one },
});
