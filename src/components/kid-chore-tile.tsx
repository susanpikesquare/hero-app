/**
 * Kid chore tile — the dense, scannable card a kid sees on their home.
 *
 * Shared by:
 *   - /kid (the kid's own device, kid-session auth)
 *   - /app/kid/[kid_id] (parent-supervised "hand to kid" mode)
 *
 * Both surfaces had a duplicate ChoreTile inline; this consolidates so the
 * design only has to be edited in one place.
 *
 * What the tile shows (per Erica's feedback):
 *   1. Reference thumbnail on the left — "this is what 'done' looks like"
 *   2. Title + reward-weight chip
 *   3. A short subtitle (last hop, or "ready when you are")
 *   4. Up to 3 coaching tips — ADHD-friendly bullets the kid can self-check
 *   5. Parent override message if there is one
 *   6. One clear CTA: "Take a photo →" / "Try again →" / hidden when done
 *   7. Status badge ONLY for non-default states (waiting, done, try_again).
 *      For "ready" we hide the badge — the green CTA is enough signal.
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChoreTodayStatus } from '@/lib/progress-stats';

const STATUS_META: Record<
  ChoreTodayStatus,
  { label: string; emoji: string; tone: 'done' | 'waiting' | 'try' | 'open' }
> = {
  done: { label: 'Done today!', emoji: '✓', tone: 'done' },
  waiting: { label: 'Waiting on your grown-up', emoji: '⏳', tone: 'waiting' },
  try_again: { label: 'Your grown-up wants another go', emoji: '🔁', tone: 'try' },
  not_yet: { label: 'Ready when you are', emoji: '📸', tone: 'open' },
};

type Props = {
  title: string;
  subtitle: string;
  overrideLine: { message: string; emoji: string } | null;
  status: ChoreTodayStatus;
  rewardWeight: number;
  onPress: () => void;
  isOptional: boolean;
  /** Signed URL for the reference photo. `null` = no reference uploaded. */
  referenceUrl: string | null;
  /** Up to 3 short coaching tips. Empty array = none configured. */
  tips: string[];
};

export function KidChoreTile({
  title,
  subtitle,
  overrideLine,
  status,
  rewardWeight,
  onPress,
  isOptional,
  referenceUrl,
  tips,
}: Props) {
  const theme = useTheme();
  const meta = STATUS_META[status];
  const isDone = status === 'done';
  const showCTA = status === 'not_yet' || status === 'try_again';
  // We show the status badge for everything EXCEPT the default open state
  // (where the green CTA below carries the message instead). This was the
  // source of Erica's "what's the difference between 'Ready when you are'
  // and 'Take a photo'?" confusion — they meant the same thing.
  const showStatusBadge = status !== 'not_yet';

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

  const visibleTips = tips.slice(0, 3);

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
      {/* Top row: reference thumbnail + title block */}
      <View style={styles.topRow}>
        {referenceUrl ? (
          <Image
            source={{ uri: referenceUrl }}
            style={[styles.thumb, { borderColor: theme.border }]}
            resizeMode="cover"
            accessibilityLabel={`What ${title.toLowerCase()} looks like when done`}
          />
        ) : (
          <View
            style={[
              styles.thumb,
              styles.thumbPlaceholder,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.thumbPlaceholderText, { color: theme.textMuted }]}>
              📸
            </Text>
          </View>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
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
        </View>
      </View>

      {/* Coaching tips — only shown if any exist AND the chore isn't done.
          The kid doesn't need the "what done looks like" checklist once
          they've already gotten the green check. */}
      {visibleTips.length > 0 && !isDone && (
        <View
          style={[
            styles.tipsBox,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.tipsHeader, { color: theme.accent }]}>
            What &apos;done&apos; looks like
          </Text>
          {visibleTips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipDot, { color: theme.accent }]}>✓</Text>
              <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Override message from parent (if any) */}
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

      {/* Status badge — hidden for the default "ready" state so the green
          CTA below isn't redundant. */}
      {showStatusBadge && (
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
      )}

      {/* Single clear CTA. The arrow makes the action unambiguous; no
          conflicting status emoji on the button. */}
      {showCTA && (
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
            {status === 'try_again' ? 'Try again →' : 'Take a photo →'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 28,
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  weightChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  weightChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Tips block — visually distinct from the rest of the tile so the kid's
  // eye lands on it as a self-check list.
  tipsBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.one,
  },
  tipsHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  tipDot: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    width: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  overrideMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  overrideEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  overrideText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusEmoji: {
    fontSize: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
