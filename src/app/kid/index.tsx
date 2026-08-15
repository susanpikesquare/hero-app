/**
 * Kid home on their own device (top-level kid app).
 *
 * Same shape as /app/kid/[kid_id] (parent-supervised mode), but the
 * kid_id is resolved from the kid's own authenticated session instead
 * of a URL param. The submit-photo route below also uses /kid/submit/...
 * which is the kid-session twin of /app/kid/[kid_id]/submit/[chore_id].
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Celebration } from '@/components/celebration';
import { KidChoreTile } from '@/components/kid-chore-tile';
import { KidShell, KidStyles } from '@/components/kid-shell';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ensureToday } from '@/lib/chore-instances';
import { hapticSuccess } from '@/lib/haptics';
import { scheduleForKid } from '@/lib/kid-reminders';
import { registerPushToken } from '@/lib/push-token';
import { useKidSession } from '@/lib/kid-session';
import { resolveKidMode, VOICE } from '@/lib/kid-mode';
import { overrideKidMessage } from '@/lib/override-copy';
import { choreStatusToday, localDateKey } from '@/lib/progress-stats';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
  nextBadgeProgress,
} from '@/lib/rewards';
import { supabase } from '@/lib/supabase';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { choreReferencePaths, useReferenceUrls } from '@/lib/use-reference-urls';

export default function KidHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state } = useKidSession();
  const { chores, submissions, loading: choresLoading, reload: reloadChores } =
    useChores(state.status === 'ready');

  // Materialize today's chore_instances on the server so the kid surface
  // is consistent with the rest of the system. Best effort.
  const familyIdForEffect = state.status === 'ready' ? state.family.id : null;
  const kidIdForEffect = state.status === 'ready' ? state.kid.id : null;
  const kidNameForEffect = state.status === 'ready' ? state.kid.display_name : null;
  useEffect(() => {
    if (familyIdForEffect) {
      void ensureToday(familyIdForEffect);
    }
  }, [familyIdForEffect]);

  // Schedule kid-side local reminders (morning + afternoon) on session
  // ready. Idempotent — calling repeatedly with the same kid is safe.
  // Asks for notification permission on first run; no-op on web.
  useEffect(() => {
    if (kidIdForEffect && kidNameForEffect) {
      void scheduleForKid({ kidId: kidIdForEffect, kidName: kidNameForEffect });
    }
  }, [kidIdForEffect, kidNameForEffect]);

  // Register this device's Expo push token against the kid's member id
  // so a parent's nudge can reach the kid as a real push notification.
  // Native + real-device only; no-op on web/simulator. Best-effort.
  useEffect(() => {
    if (kidIdForEffect) {
      void registerPushToken(kidIdForEffect);
    }
  }, [kidIdForEffect]);
  // Batch-fetch signed URLs for every chore's reference photo so the tiles
  // can show "what 'done' looks like" inline. Returns empty map until the
  // chores load, which is fine — KidChoreTile falls back to a 📸 placeholder.
  const referenceUrls = useReferenceUrls(chores.flatMap(choreReferencePaths));

  // For self-care / checklist chores the kid taps "Mark done" right on the
  // tile — no photo, no AI eval. We auto-approve the submission server-side
  // (status='complete', ai_verdict='pass') so it lands the same way an
  // AI-approved photo would: counts for rewards, fills the heatmap, doesn't
  // sit in the parent's review queue.
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);
  // Celebration config — bump `trigger` to fire. `big` = a badge unlock.
  const [celebration, setCelebration] = useState({
    trigger: 0,
    emoji: '🐰',
    label: 'Nice hop!',
    big: false,
  });
  const markChoreDone = async (choreId: string) => {
    if (state.status !== 'ready' || markingDoneId) return;
    // Idempotency guard: a self-attest chore can only be completed once
    // per day. If it's already done today, do nothing (Susan QA,
    // 2026-06-08 — tapping a done tile logged duplicate completions).
    if (choreStatusToday(choreId, state.kid.id, submissions) === 'done') {
      return;
    }
    setMarkingDoneId(choreId);
    try {
      const { error: insertErr } = await supabase.from('submissions').insert({
        chore_id: choreId,
        submitted_by: state.kid.id,
        photo_path: null,
        status: 'complete',
        ai_verdict: 'pass',
        ai_feedback: 'Self-reported as done.',
        ai_evaluated_at: new Date().toISOString(),
      });
      if (insertErr) throw insertErr;
      await reloadChores();
      // The dopamine moment — buzz + confetti on a successful complete.
      hapticSuccess();
      // Did this completion cross a badge threshold? If so, celebrate
      // bigger with the badge itself. (submissions here is the pre-reload
      // snapshot, so earnedBefore + this chore's weight = the new total.)
      const weight = chores.find((c) => c.id === choreId)?.reward_weight ?? 1;
      const earnedBefore = earnedCountFor(state.kid.id, submissions, chores);
      const badgeBefore = latestBadge(earnedBefore);
      const badgeAfter = latestBadge(earnedBefore + weight);
      const unlocked =
        badgeAfter && badgeAfter.threshold !== badgeBefore?.threshold
          ? badgeAfter
          : null;
      const mascot = VOICE[
        resolveKidMode({ setting: state.kid.kid_mode, age: state.kid.age })
      ].showMascot;
      setCelebration((c) => ({
        trigger: c.trigger + 1,
        emoji: unlocked ? unlocked.emoji : mascot ? '🐰' : '🎉',
        label: unlocked
          ? `${unlocked.label} unlocked!`
          : mascot
            ? 'Nice hop!'
            : 'Nice work!',
        big: !!unlocked,
      }));
    } catch (err) {
      console.error('mark chore done failed:', err);
    } finally {
      setMarkingDoneId(null);
    }
  };

  // Undo an accidental mark-done. Deletes TODAY's self-attest
  // submission(s) for this chore (photo_path null = self-reported, never
  // a photo submission). Reuses the in-flight markingDoneId guard so the
  // tile shows "Undoing…" and double-taps are blocked.
  const undoChoreDone = async (choreId: string) => {
    if (state.status !== 'ready' || markingDoneId) return;
    setMarkingDoneId(choreId);
    try {
      const todayKey = localDateKey(new Date());
      const toDelete = submissions.filter(
        (s) =>
          s.chore_id === choreId &&
          s.submitted_by === state.kid.id &&
          s.photo_path === null &&
          localDateKey(new Date(s.submitted_at)) === todayKey
      );
      for (const s of toDelete) {
        const { error: delErr } = await supabase
          .from('submissions')
          .delete()
          .eq('id', s.id);
        if (delErr) throw delErr;
      }
      await reloadChores();
    } catch (err) {
      console.error('undo chore done failed:', err);
    } finally {
      setMarkingDoneId(null);
    }
  };

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
  // Resolve the display mode so this surface speaks to the right age.
  // Parent set kid_mode='auto' (default) → resolve from age.
  // Parent set kid_mode='teen' on a 9-year-old → respect that.
  const resolvedMode = resolveKidMode({
    setting: kid.kid_mode,
    age: kid.age,
  });
  const voice = VOICE[resolvedMode];

  const allKidChores = choresForKid(chores, kidId);
  const requiredChores = allKidChores.filter((c) => !c.is_optional);
  const optionalChores = allKidChores.filter((c) => c.is_optional);
  // Split the daily required list into healthy habits (self-care, no
  // photo) and home chores, so the kid sees personal care distinct from
  // contribution (Erica, 2026-07-25 — "separate personal care vs chores").
  const requiredHabits = requiredChores.filter(
    (c) => c.verification_kind === 'checklist'
  );
  const requiredChoreItems = requiredChores.filter(
    (c) => c.verification_kind !== 'checklist'
  );

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

  // Shared tile renderer so habits / chores / extras all render the same
  // tile without duplicating ~40 lines three times.
  const renderTile = (chore: (typeof chores)[number], isOptional: boolean) => {
    const subs = submissionsForChore(submissions, chore.id);
    const last = subs[0];
    const lastOverride = last
      ? overrideKidMessage(last.parent_override, last.parent_override_reason)
      : null;
    const status = choreStatusToday(chore.id, kidId, submissions);
    const refUrls = choreReferencePaths(chore)
      .map((p) => referenceUrls[p])
      .filter((u): u is string => !!u);
    const isChecklist = chore.verification_kind === 'checklist';
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
            : isOptional
              ? 'Pick it up when you want to!'
              : isChecklist
                ? 'Tap when you’re done — no photo needed.'
                : 'No hops yet — ready when you are.'
        }
        overrideLine={lastOverride}
        status={status}
        rewardWeight={chore.reward_weight}
        onPress={
          isChecklist
            ? () => markChoreDone(chore.id)
            : () => router.push(`/kid/submit/${chore.id}`)
        }
        onUndo={
          isChecklist && status === 'done'
            ? () => undoChoreDone(chore.id)
            : undefined
        }
        isOptional={isOptional}
        referenceUrls={refUrls}
        tips={chore.coaching_tips}
        verification={chore.verification_kind}
        busy={markingDoneId === chore.id}
        voice={voice}
      />
    );
  };

  return (
    <KidShell
      back={{ href: '/kid/join', label: 'Switch user' }}
      showMascot={voice.showMascot}
    >
      <View style={styles.greeting}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          {voice.greetingEyebrow(kid.display_name)}
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          {remaining === 0 && requiredChores.length > 0
            ? voice.allDoneTitle
            : voice.todayTitle}
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          {requiredChores.length === 0
            ? 'No chores set up yet — ask a grown-up to add one.'
            : remaining === 0
              ? `You finished all ${requiredChores.length}. ${optionalChores.length > 0 ? 'Extras below if you want more.' : 'Nice work.'}`
              : voice.remainingHint(doneToday, requiredChores.length)}
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

      {requiredHabits.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          <View style={styles.sectionHeader}>
            <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
              Healthy habits
            </Text>
            <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
              Taking care of you. Tap when you’re done — no photo needed.
            </Text>
          </View>
          {requiredHabits.map((chore) => renderTile(chore, false))}
        </View>
      )}

      {requiredChoreItems.length > 0 && (
        <View style={{ gap: Spacing.three }}>
          <View style={styles.sectionHeader}>
            <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
              Chores
            </Text>
            <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
              Helping out at home.
            </Text>
          </View>
          {requiredChoreItems.map((chore) => renderTile(chore, false))}
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
          {optionalChores.map((chore) => renderTile(chore, true))}
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

      <Celebration
        trigger={celebration.trigger}
        emoji={celebration.emoji}
        label={celebration.label}
        big={celebration.big}
      />
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
