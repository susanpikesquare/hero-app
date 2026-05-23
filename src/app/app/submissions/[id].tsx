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
  const { submissions, chores, loading } = useChores(!!session);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const submission = submissions.find((s) => s.id === params.id);
  const chore = submission ? chores.find((c) => c.id === submission.chore_id) : null;
  const kid = submission
    ? kids.find((k) => k.id === submission.submitted_by)
    : null;

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={64} />
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

          <View
            style={[
              styles.aiCard,
              { backgroundColor: theme.infoSoft, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="eyebrow" themeColor="info">
              AI review
            </BrandHeading>
            <ThemedText type="default" themeColor="text">
              Coming next session. For now this is your visual review — does
              {' '}
              {kid?.display_name ?? 'your kid'} call this done? You can talk
              to them about it when you&rsquo;re next together.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
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
  wordmark: { letterSpacing: 0.5 },
  header: {
    gap: Spacing.two,
    maxWidth: ReadableContentWidth,
  },
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
