import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { overrideKidMessage } from '@/lib/override-copy';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
  nextBadgeProgress,
} from '@/lib/rewards';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

export default function KidHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ kid_id: string }>();
  const kidId = params.kid_id;

  const { kids, family, loading: famLoading } = useFamily(!!session);
  const { chores, submissions, loading: choresLoading } = useChores(!!session);

  if (famLoading || choresLoading) {
    return (
      <KidShell>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          One sec…
        </Text>
      </KidShell>
    );
  }

  const kid = kids.find((k) => k.id === kidId);
  if (!kid) {
    return (
      <KidShell>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Hmm — we couldn&rsquo;t find you.
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Ask a grown-up to hand you the device again.
        </Text>
      </KidShell>
    );
  }

  const kidChores = choresForKid(chores, kidId);
  const descriptor = descriptorFor(family?.reward_mode);
  const earned = earnedCountFor(kidId, submissions);
  const badge = latestBadge(earned);
  const progress = nextBadgeProgress(earned);
  const showRewards = descriptor.mode !== 'off';
  const showCounter = descriptor.mode === 'hops' || descriptor.mode === 'stars';

  return (
    <KidShell>
      <View style={styles.greeting}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          Hi {kid.display_name} 👋
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Ready to hop on a chore?
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Tap a chore, take a photo when you&rsquo;re done, and your grown-up
          gets a heads-up.
        </Text>
      </View>

      {showRewards && (
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.accentSoft, borderColor: theme.border },
          ]}
        >
          {showCounter ? (
            <View style={styles.statsHeaderRow}>
              <Text style={styles.bigEmoji}>{descriptor.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigCount, { color: theme.text }]}>
                  {earned}
                </Text>
                <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
                  {earned === 1
                    ? `${descriptor.unitSingular} earned`
                    : `${descriptor.unitPlural} earned`}
                </Text>
              </View>
              {badge && (
                <View
                  style={[
                    styles.badgeChip,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <Text style={styles.badgeChipEmoji}>{badge.emoji}</Text>
                  <Text style={[styles.badgeChipLabel, { color: theme.text }]}>
                    {badge.label}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // badges-only mode: still surface the latest badge, but no count
            <View style={styles.statsHeaderRow}>
              <Text style={styles.bigEmoji}>{badge?.emoji ?? '🏅'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigCount, { color: theme.text, fontSize: 22 }]}>
                  {badge ? badge.label : 'No badges yet'}
                </Text>
                <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
                  {badge ? 'latest badge' : 'submit a chore to earn one'}
                </Text>
              </View>
            </View>
          )}

          {progress && (
            <View style={{ gap: Spacing.one }}>
              <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
                {progress.target - progress.current} more until{' '}
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  {nextBadgeNameFor(progress.target)}
                </Text>
                .
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.accent,
                      width: `${Math.round(progress.percent * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {kidChores.length === 0 ? (
        <View
          style={[
            KidStyles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <Text style={[KidStyles.choreTitle, { color: theme.text }]}>
            No chores yet.
          </Text>
          <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
            A grown-up needs to set one up for you. Check back in a sec!
          </Text>
        </View>
      ) : (
        <View style={{ gap: Spacing.three }}>
          {kidChores.map((chore) => {
            const subs = submissionsForChore(submissions, chore.id);
            const last = subs[0];
            const lastOverride = last
              ? overrideKidMessage(last.parent_override, last.parent_override_reason)
              : null;
            return (
              <Pressable
                key={chore.id}
                onPress={() => router.push(`/app/kid/${kidId}/submit/${chore.id}`)}
                style={({ pressed }) => [
                  KidStyles.card,
                  {
                    backgroundColor: pressed ? theme.accentSoft : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[KidStyles.choreTitle, { color: theme.text }]}>
                  {chore.title}
                </Text>
                <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
                  {last
                    ? `Last hop: ${new Date(last.submitted_at).toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'No hops yet — ready when you are.'}
                </Text>
                {lastOverride && (
                  <View
                    style={[
                      styles.overrideMessage,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.overrideEmoji}>{lastOverride.emoji}</Text>
                    <Text style={[styles.overrideText, { color: theme.text }]}>
                      {lastOverride.message}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    KidStyles.bigButton,
                    { backgroundColor: theme.accent, alignSelf: 'flex-start', paddingHorizontal: Spacing.four },
                  ]}
                >
                  <Text
                    style={[KidStyles.bigButtonLabel, { color: theme.background }]}
                  >
                    📸 Take a photo
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </KidShell>
  );
}

function nextBadgeNameFor(target: number): string {
  // Tiny helper so the kid sees the badge label in the progress copy.
  // (badge list lives in src/lib/rewards.ts.)
  const map: Record<number, string> = {
    1: 'First Hop',
    5: 'Five Strong',
    10: 'Ten Up',
    25: '25 Club',
    50: 'Half-Century',
    100: 'Hundo Hero',
  };
  return map[target] ?? `${target} earned`;
}

const styles = StyleSheet.create({
  greeting: { gap: Spacing.three },
  statsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bigEmoji: { fontSize: 56 },
  bigCount: {
    fontFamily: 'system-ui',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  badgeChipEmoji: { fontSize: 18 },
  badgeChipLabel: { fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  overrideMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  overrideEmoji: { fontSize: 22 },
  overrideText: {
    fontFamily: 'system-ui',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    flex: 1,
  },
});
