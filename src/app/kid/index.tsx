/**
 * Kid home on their own device (top-level kid app).
 *
 * Same shape as /app/kid/[kid_id] (parent-supervised mode), but the
 * kid_id is resolved from the kid's own authenticated session instead
 * of a URL param. The submit-photo route below also uses /kid/submit/...
 * which is the kid-session twin of /app/kid/[kid_id]/submit/[chore_id].
 */

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { KidChoreTile } from '@/components/kid-chore-tile';
import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useKidSession } from '@/lib/kid-session';
import { overrideKidMessage } from '@/lib/override-copy';
import { choreStatusToday } from '@/lib/progress-stats';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
  nextBadgeProgress,
} from '@/lib/rewards';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useReferenceUrls } from '@/lib/use-reference-urls';

export default function KidHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state } = useKidSession();
  const { chores, submissions, loading: choresLoading } = useChores(
    state.status === 'ready'
  );
  // Batch-fetch signed URLs for every chore's reference photo so the tiles
  // can show "what 'done' looks like" inline. Returns empty map until the
  // chores load, which is fine — KidChoreTile falls back to a 📸 placeholder.
  const referenceUrls = useReferenceUrls(
    chores.map((c) => c.reference_photo_path)
  );

  if (state.status !== 'ready' || choresLoading) {
    return (
      <KidShell back={{ href: '/kid/join', label: 'Switch user' }}>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          One sec…
        </Text>
      </KidShell>
    );
  }

  const kid = state.kid;
  const family = state.family;
  const kidId = kid.id;

  const allKidChores = choresForKid(chores, kidId);
  const requiredChores = allKidChores.filter((c) => !c.is_optional);
  const optionalChores = allKidChores.filter((c) => c.is_optional);

  const descriptor = descriptorFor(family.reward_mode);
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
    <KidShell back={{ href: '/kid/join', label: 'Switch user' }}>
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

      {requiredChores.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          {requiredChores.map((chore) => {
            const subs = submissionsForChore(submissions, chore.id);
            const last = subs[0];
            const lastOverride = last
              ? overrideKidMessage(last.parent_override, last.parent_override_reason)
              : null;
            const status = choreStatusToday(chore.id, kidId, submissions);
            const refUrl = chore.reference_photo_path
              ? (referenceUrls[chore.reference_photo_path] ?? null)
              : null;
            return (
              <KidChoreTile
                key={chore.id}
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
                onPress={() => router.push(`/kid/submit/${chore.id}`)}
                isOptional={false}
                referenceUrl={refUrl}
                tips={chore.coaching_tips}
              />
            );
          })}
        </View>
      )}

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
            const refUrl = chore.reference_photo_path
              ? (referenceUrls[chore.reference_photo_path] ?? null)
              : null;
            return (
              <KidChoreTile
                key={chore.id}
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
                onPress={() => router.push(`/kid/submit/${chore.id}`)}
                isOptional
                referenceUrl={refUrl}
                tips={chore.coaching_tips}
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
});
