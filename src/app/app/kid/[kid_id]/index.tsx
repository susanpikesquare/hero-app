import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { overrideKidMessage } from '@/lib/override-copy';
import { choreStatusToday, type ChoreTodayStatus } from '@/lib/progress-stats';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
  nextBadgeProgress,
} from '@/lib/rewards';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

const STATUS_META: Record<
  ChoreTodayStatus,
  { label: string; emoji: string; tone: 'done' | 'waiting' | 'try' | 'open' }
> = {
  done: { label: 'Done today!', emoji: '✓', tone: 'done' },
  waiting: { label: 'Waiting on your grown-up', emoji: '⏳', tone: 'waiting' },
  try_again: { label: 'Your grown-up wants another go', emoji: '🔁', tone: 'try' },
  not_yet: { label: 'Ready when you are', emoji: '📸', tone: 'open' },
};

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
          Hmm — we couldn’t find you.
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Ask a grown-up to hand you the device again.
        </Text>
      </KidShell>
    );
  }

  const allKidChores = choresForKid(chores, kidId);
  const requiredChores = allKidChores.filter((c) => !c.is_optional);
  const optionalChores = allKidChores.filter((c) => c.is_optional);

  const descriptor = descriptorFor(family?.reward_mode);
  const earned = earnedCountFor(kidId, submissions, chores);
  const badge = latestBadge(earned);
  const progress = nextBadgeProgress(earned);
  const showRewards = descriptor.mode !== 'off';
  const showCounter = descriptor.mode === 'hops' || descriptor.mode === 'stars';

  const doneToday = requiredChores.filter(
    (c) => choreStatusToday(c.id, kidId, submissions) === 'done'
  ).length;
  const remaining = requiredChores.length - doneToday;

  return (
    <KidShell>
      <View style={styles.greeting}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          Hi {kid.display_name} 👋
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          {remaining === 0 && requiredChores.length > 0
            ? "You're all done for today!"
            : 'Today’s to-dos'}
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          {requiredChores.length === 0
            ? 'No chores set up yet — ask a grown-up to add one.'
            : remaining === 0
              ? `You finished all ${requiredChores.length}. ${optionalChores.length > 0 ? 'Extras below if you want more.' : 'Nice work.'}`
              : `${doneToday} of ${requiredChores.length} done. Tap any chore to send a photo when you're ready.`}
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

      {/* Required chores */}
      {requiredChores.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          {requiredChores.map((chore) => {
            const subs = submissionsForChore(submissions, chore.id);
            const last = subs[0];
            const lastOverride = last
              ? overrideKidMessage(last.parent_override, last.parent_override_reason)
              : null;
            const status = choreStatusToday(chore.id, kidId, submissions);
            return (
              <ChoreTile
                key={chore.id}
                theme={theme}
                title={chore.title}
                subtitle={
                  last
                    ? `Last hop: ${new Date(last.submitted_at).toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'No hops yet — ready when you are.'
                }
                overrideLine={lastOverride}
                status={status}
                rewardWeight={chore.reward_weight}
                onPress={() => router.push(`/app/kid/${kidId}/submit/${chore.id}`)}
                isOptional={false}
              />
            );
          })}
        </View>
      )}

      {/* Extra jobs */}
      {optionalChores.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          <View style={styles.sectionHeader}>
            <Text style={[KidStyles.greetingEyebrow, { color: theme.info }]}>
              Extra jobs · earn bonus {descriptor.unitPlural || 'rewards'}
            </Text>
            <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
              Want to do more? These are optional — pick what you like.
            </Text>
          </View>

          {optionalChores.map((chore) => {
            const subs = submissionsForChore(submissions, chore.id);
            const last = subs[0];
            const lastOverride = last
              ? overrideKidMessage(last.parent_override, last.parent_override_reason)
              : null;
            const status = choreStatusToday(chore.id, kidId, submissions);
            return (
              <ChoreTile
                key={chore.id}
                theme={theme}
                title={chore.title}
                subtitle={
                  last
                    ? `Last hop: ${new Date(last.submitted_at).toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'Pick it up when you want to!'
                }
                overrideLine={lastOverride}
                status={status}
                rewardWeight={chore.reward_weight}
                onPress={() => router.push(`/app/kid/${kidId}/submit/${chore.id}`)}
                isOptional
              />
            );
          })}
        </View>
      )}

      {requiredChores.length === 0 && optionalChores.length === 0 && (
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
      )}
    </KidShell>
  );
}

function ChoreTile({
  theme,
  title,
  subtitle,
  overrideLine,
  status,
  rewardWeight,
  onPress,
  isOptional,
}: {
  theme: ReturnType<typeof useTheme>;
  title: string;
  subtitle: string;
  overrideLine: { message: string; emoji: string } | null;
  status: ChoreTodayStatus;
  rewardWeight: number;
  onPress: () => void;
  isOptional: boolean;
}) {
  const meta = STATUS_META[status];
  const isDone = status === 'done';

  const statusBg =
    meta.tone === 'done'
      ? theme.accentSoft
      : meta.tone === 'try'
        ? '#F3E8D6'
        : meta.tone === 'waiting'
          ? theme.infoSoft
          : theme.background;
  const statusFg =
    meta.tone === 'done'
      ? theme.accent
      : meta.tone === 'try'
        ? '#8A5A1F'
        : meta.tone === 'waiting'
          ? theme.info
          : theme.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        KidStyles.card,
        {
          backgroundColor: pressed ? theme.accentSoft : theme.backgroundElement,
          borderColor: isOptional ? theme.info : theme.border,
          opacity: isDone ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <Text style={[KidStyles.choreTitle, { color: theme.text, flex: 1 }]}>
          {title}
        </Text>
        {rewardWeight > 1 && (
          <View
            style={[
              styles.weightChip,
              { backgroundColor: theme.infoSoft, borderColor: theme.info },
            ]}
          >
            <Text style={[styles.weightChipText, { color: theme.info }]}>
              +{rewardWeight}
            </Text>
          </View>
        )}
      </View>
      <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
        {subtitle}
      </Text>
      {overrideLine && (
        <View
          style={[
            styles.overrideMessage,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Text style={styles.overrideEmoji}>{overrideLine.emoji}</Text>
          <Text style={[styles.overrideText, { color: theme.text }]}>
            {overrideLine.message}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.statusEmoji, { color: statusFg }]}>{meta.emoji}</Text>
        <Text style={[styles.statusLabel, { color: statusFg }]}>
          {isDone && isOptional ? `Bonus ${meta.label.toLowerCase()}` : meta.label}
        </Text>
      </View>
      {!isDone && (
        <View
          style={[
            KidStyles.bigButton,
            {
              backgroundColor: isOptional ? theme.info : theme.accent,
              alignSelf: 'flex-start',
              paddingHorizontal: Spacing.four,
            },
          ]}
        >
          <Text style={[KidStyles.bigButtonLabel, { color: theme.background }]}>
            {status === 'try_again' ? '📸 Try again' : '📸 Take a photo'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function nextBadgeNameFor(target: number): string {
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
  progressFill: { height: '100%' },
  sectionHeader: { gap: Spacing.one, marginTop: Spacing.three },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  weightChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  weightChipText: { fontSize: 14, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  statusEmoji: { fontSize: 16 },
  statusLabel: { fontSize: 13, fontWeight: '700' },
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
