import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { articleForAge, ARTICLES } from '@/lib/articles';
import { useAuth } from '@/lib/auth-context';
import {
  PROFILE_OPTIONS,
  type SupportProfile,
} from '@/lib/neurodivergence-context';
import { computeKidPulse } from '@/lib/progress-stats';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
} from '@/lib/rewards';
import { ensureToday } from '@/lib/chore-instances';
import { supabase } from '@/lib/supabase';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';
import {
  NUDGE_METACOGNITION_THRESHOLD,
  recordNudge,
  useNudgeCount,
} from '@/lib/use-nudge';

export function ParentDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { family, parent, kids, loading: famLoading, error: famError, addKid } =
    useFamily(!!session);
  const {
    chores,
    submissions,
    loading: choresLoading,
    reload: reloadChores,
  } = useChores(!!session);

  // Materialize today's chore_instances on the server so the schema is
  // consistent (every active recurring chore has a row for today). Best
  // effort — existing submission-derived status logic keeps working for
  // daily chores regardless of whether this succeeds.
  useEffect(() => {
    if (family?.id) {
      void ensureToday(family.id);
    }
  }, [family?.id]);

  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [newKidProfiles, setNewKidProfiles] = useState<SupportProfile[]>([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const onAddKid = async () => {
    setAddError(null);
    if (!newKidName.trim()) {
      setAddError('Give your kid a name to show in the app.');
      return;
    }
    const trimmedAge = newKidAge.trim();
    let age: number | null = null;
    if (!trimmedAge) {
      setAddError("Age is required — we use it to suggest age-appropriate chores.");
      return;
    }
    const parsed = Number.parseInt(trimmedAge, 10);
    if (!Number.isFinite(parsed)) {
      setAddError('Age should be a number.');
      return;
    }
    if (parsed < 4 || parsed > 18) {
      setAddError(
        `Home Hero is built for ages 4–18. ${parsed < 4 ? 'For younger kids, this app probably isn’t the right fit yet.' : 'For older kids, the framework still works — pick "Age 18" and it’ll suggest senior-year chores.'}`
      );
      return;
    }
    age = parsed;
    setAdding(true);
    try {
      const newKidId = await addKid({
        displayName: newKidName,
        age,
        supportProfiles: newKidProfiles,
      });
      setNewKidName('');
      setNewKidAge('');
      setNewKidProfiles([]);
      if (newKidId) {
        router.push(`/app/kid/${newKidId}/setup`);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add kid.');
    } finally {
      setAdding(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (famLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading your family…
        </ThemedText>
      </View>
    );
  }

  const recentSubmissions = submissions.slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.page}>
          <View style={styles.nav}>
            <BrandLogo height={96} />
            <View style={styles.navActions}>
              <BrandButton
                variant="ghost"
                label="Coaching"
                onPress={() => router.push('/app/coaching/parent-says')}
              />
              <BrandButton
                variant="ghost"
                label="Articles"
                onPress={() => router.push('/app/articles')}
              />
              <BrandButton
                variant="ghost"
                label="Settings"
                onPress={() => router.push('/app/settings')}
              />
              <BrandButton variant="ghost" label="Sign out" onPress={onSignOut} />
            </View>
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {family?.name ?? 'Your family'}
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Welcome back, {parent?.display_name ?? 'parent'}.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              This is your parental control surface. Add kids, give each one a
              chore, then hand the device over and tap “Hand to …”
              so they can submit a photo.
            </ThemedText>
          </View>

          {famError && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {famError}
            </ThemedText>
          )}

          {/* Today's family pulse */}
          {kids.length > 0 && (() => {
            const choreWeights = new Map(chores.map((c) => [c.id, c.reward_weight]));
            const pulses = kids.map((k) => {
              const required = choresForKid(chores, k.id).filter((c) => !c.is_optional);
              return {
                kid: k,
                pulse: computeKidPulse(
                  k.id,
                  required.map((c) => c.id),
                  submissions,
                  choreWeights
                ),
              };
            });
            const familyHops = pulses.reduce((sum, p) => sum + p.pulse.hopsToday, 0);
            const familyDone = pulses.reduce((sum, p) => sum + p.pulse.doneToday, 0);
            const familyRequired = pulses.reduce(
              (sum, p) => sum + p.pulse.requiredToday,
              0
            );
            const familyAwaiting = pulses.reduce(
              (sum, p) => sum + p.pulse.awaitingReview,
              0
            );
            const today = new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            });
            const descriptor = descriptorFor(family?.reward_mode);
            return (
              <Card theme={theme} tone="elevated">
                <View style={styles.pulseHeader}>
                  <ThemedText
                    type="smallBold"
                    themeColor="accent"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    Today &middot; {today}
                  </ThemedText>
                  {familyAwaiting > 0 && (
                    <Pressable
                      onPress={() => router.push('/app/queue')}
                      hitSlop={6}
                    >
                      <View
                        style={[
                          styles.awaitingChip,
                          { backgroundColor: '#F3E8D6', borderColor: '#D6B98E' },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={{ color: '#8A5A1F' }}
                        >
                          {familyAwaiting} ready for your eyes →
                        </ThemedText>
                      </View>
                    </Pressable>
                  )}
                </View>

                <View style={styles.pulseStatsRow}>
                  <PulseStat
                    theme={theme}
                    value={String(familyHops)}
                    label={
                      familyHops === 1
                        ? `${descriptor.unitSingular} today`
                        : `${descriptor.unitPlural || 'rewards'} today`
                    }
                    emoji={descriptor.emoji}
                  />
                  <PulseStat
                    theme={theme}
                    value={
                      familyRequired === 0
                        ? '—'
                        : `${familyDone}/${familyRequired}`
                    }
                    label="chores done today"
                  />
                  <PulseStat
                    theme={theme}
                    value={String(familyAwaiting)}
                    label="ready for your eyes"
                  />
                </View>

                <View style={styles.pulseKidsList}>
                  {pulses.map(({ kid, pulse }) => {
                    const fraction =
                      pulse.requiredToday === 0
                        ? null
                        : pulse.doneToday / pulse.requiredToday;
                    const allDone =
                      pulse.requiredToday > 0 &&
                      pulse.doneToday === pulse.requiredToday;
                    return (
                      <Pressable
                        key={kid.id}
                        onPress={() => router.push(`/app/kid/${kid.id}/progress`)}
                        style={[
                          styles.pulseKidRow,
                          {
                            backgroundColor: theme.background,
                            borderColor: allDone ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <ThemedText type="default" style={{ fontWeight: '600' }}>
                            {kid.display_name}
                            {kid.age != null ? ` · ${kid.age}` : ''}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textMuted">
                            {pulse.requiredToday === 0
                              ? 'No required chores today'
                              : allDone
                                ? `✓ All ${pulse.requiredToday} done`
                                : `${pulse.doneToday} of ${pulse.requiredToday} done${pulse.awaitingReview > 0 ? ` · ${pulse.awaitingReview} ready for your eyes` : ''}`}
                          </ThemedText>
                          {fraction !== null && !allDone && (
                            <View
                              style={[
                                styles.pulseBar,
                                { backgroundColor: theme.backgroundElement },
                              ]}
                            >
                              <View
                                style={[
                                  styles.pulseBarFill,
                                  {
                                    backgroundColor: theme.accent,
                                    width: `${Math.round(fraction * 100)}%`,
                                  },
                                ]}
                              />
                            </View>
                          )}
                        </View>
                        {pulse.hopsToday > 0 && (
                          <View
                            style={[
                              styles.pulseHopsChip,
                              {
                                backgroundColor: theme.accentSoft,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <ThemedText type="default" style={{ fontSize: 16 }}>
                              {descriptor.emoji}
                            </ThemedText>
                            <ThemedText type="smallBold">
                              +{pulse.hopsToday}
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText type="small" themeColor="textSecondary">
                          View →
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            );
          })()}

          {/* Kids + their chores */}
          {kids.length === 0 ? (
            <Card theme={theme} tone="elevated">
              <BrandHeading level="h2" style={styles.cardTitle}>
                Set up your family operating system
              </BrandHeading>
              <ThemedText type="default" themeColor="textSecondary">
                This works best as a whole-family stand-up — every kid in.
                Add them all now while you have the time and the attention.
                You can always come back and add more, but the first run
                should cover everyone.
              </ThemedText>
              <AddKidRow
                name={newKidName}
                age={newKidAge}
                profiles={newKidProfiles}
                onChangeName={setNewKidName}
                onChangeAge={setNewKidAge}
                onChangeProfiles={setNewKidProfiles}
                onSubmit={onAddKid}
                disabled={adding}
                error={addError}
              />
            </Card>
          ) : (
            kids.map((kid) => {
              const kidChores = choresForKid(chores, kid.id);
              const earned = earnedCountFor(kid.id, submissions, chores);
              const badge = latestBadge(earned);
              const rewardDescriptor = descriptorFor(family?.reward_mode);
              const showRewardChip =
                rewardDescriptor.mode !== 'off' &&
                (rewardDescriptor.mode === 'hops' ||
                  rewardDescriptor.mode === 'stars'
                  ? earned > 0
                  : !!badge);
              return (
                <Card key={kid.id} theme={theme} tone="elevated">
                  <View style={styles.kidHeader}>
                    <View style={{ gap: 4 }}>
                      <BrandHeading level="h2" style={styles.cardTitle}>
                        {kid.display_name}
                      </BrandHeading>
                      <View style={styles.kidMetaRow}>
                        <ThemedText type="small" themeColor="textMuted">
                          {kid.age != null ? `Age ${kid.age} · ` : ''}
                          {kidChores.length === 0
                            ? 'no chores yet'
                            : `${kidChores.length} chore${kidChores.length === 1 ? '' : 's'}`}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted">
                          ·
                        </ThemedText>
                        <Pressable
                          onPress={() => router.push(`/app/kid/${kid.id}/progress`)}
                          hitSlop={8}
                        >
                          <ThemedText
                            type="small"
                            themeColor="info"
                            style={{ textDecorationLine: 'underline' }}
                          >
                            Progress
                          </ThemedText>
                        </Pressable>
                        <ThemedText type="small" themeColor="textMuted">
                          ·
                        </ThemedText>
                        <Pressable
                          onPress={() => router.push(`/app/kid/${kid.id}/settings`)}
                          hitSlop={8}
                        >
                          <ThemedText
                            type="small"
                            themeColor="info"
                            style={{ textDecorationLine: 'underline' }}
                          >
                            Manage
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                    <BrandButton
                      label={`Hand to ${kid.display_name}`}
                      onPress={() => router.push(`/app/kid/${kid.id}`)}
                    />
                  </View>

                  {showRewardChip && (
                    <View style={styles.rewardChipRow}>
                      {(rewardDescriptor.mode === 'hops' ||
                        rewardDescriptor.mode === 'stars') && (
                        <View
                          style={[
                            styles.rewardChip,
                            {
                              backgroundColor: theme.accentSoft,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <ThemedText type="default" style={styles.rewardChipEmoji}>
                            {rewardDescriptor.emoji}
                          </ThemedText>
                          <ThemedText type="smallBold">
                            {earned}{' '}
                            {earned === 1
                              ? rewardDescriptor.unitSingular
                              : rewardDescriptor.unitPlural}
                          </ThemedText>
                        </View>
                      )}
                      {badge && (
                        <View
                          style={[
                            styles.rewardChip,
                            {
                              backgroundColor: theme.infoSoft,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <ThemedText type="default" style={styles.rewardChipEmoji}>
                            {badge.emoji}
                          </ThemedText>
                          <ThemedText type="smallBold">{badge.label}</ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {kidChores.length === 0 ? (
                    <ThemedText type="default" themeColor="textSecondary">
                      Give {kid.display_name} a chore to start.
                    </ThemedText>
                  ) : (
                    <View style={styles.choresList}>
                      {kidChores.map((chore) => {
                        const subs = submissionsForChore(submissions, chore.id);
                        const hasRef = !!chore.reference_photo_path;
                        return (
                          <ChoreRow
                            key={chore.id}
                            chore={chore}
                            subsCount={subs.length}
                            hasRef={hasRef}
                            theme={theme}
                            onOpen={() =>
                              router.push(`/app/chores/${chore.id}`)
                            }
                            onDeleted={async () => {
                              // Reload chores so the row disappears.
                              await reloadChores();
                            }}
                          />
                        );
                      })}
                    </View>
                  )}

                  {/* Gentle nudge + AI metacognition (per Erica June 3).
                      In MVP we log the nudge but don't yet ship cross-
                      device push (Beta, PRD §9.13). The metacognition
                      callout fires when count >= NUDGE_METACOGNITION_THRESHOLD. */}
                  {parent && family && (
                    <NudgeRow
                      kidId={kid.id}
                      kidName={kid.display_name}
                      familyId={family.id}
                      parentId={parent.id}
                      theme={theme}
                    />
                  )}
                </Card>
              );
            })
          )}

          {/* Add chore + add kid actions */}
          {kids.length > 0 && (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => router.push('/app/chores/new')}
                style={[
                  styles.actionBtn,
                  { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                ]}
              >
                <ThemedText type="smallBold">+ New chore</ThemedText>
              </Pressable>
              <View style={styles.addKidInline}>
                <AddKidRow
                  name={newKidName}
                  age={newKidAge}
                  profiles={newKidProfiles}
                  onChangeName={setNewKidName}
                  onChangeAge={setNewKidAge}
                  onChangeProfiles={setNewKidProfiles}
                  onSubmit={onAddKid}
                  disabled={adding}
                  error={addError}
                  variant="inline"
                />
              </View>
            </View>
          )}

          {/* For parents — coaching content */}
          {(() => {
            const youngestWithAge = kids.find((k) => k.age != null);
            const featured =
              articleForAge(youngestWithAge?.age ?? null) ?? ARTICLES[1];
            if (!featured) return null;
            return (
              <Card theme={theme} tone="elevated">
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  For parents
                </ThemedText>
                <BrandHeading level="h2" style={styles.cardTitle}>
                  {featured.title}
                </BrandHeading>
                <ThemedText
                  type="default"
                  themeColor="textSecondary"
                  style={{ lineHeight: 26 }}
                >
                  {featured.blurb}
                </ThemedText>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => router.push(`/app/articles/${featured.slug}`)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      Read article
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/app/articles')}
                    style={[
                      styles.actionBtn,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <ThemedText type="smallBold">Browse all articles</ThemedText>
                  </Pressable>
                </View>
              </Card>
            );
          })()}

          {/* Recent submissions */}
          <Card theme={theme} tone="info">
            <BrandHeading level="h2" style={styles.cardTitle}>
              Recent submissions
            </BrandHeading>
            {choresLoading ? (
              <ThemedText type="default" themeColor="textSecondary">
                Loading…
              </ThemedText>
            ) : recentSubmissions.length === 0 ? (
              <ThemedText type="default" themeColor="text">
                Nothing yet. When your kid submits a photo, it appears here.
              </ThemedText>
            ) : (
              <View style={styles.submissionsList}>
                {recentSubmissions.map((sub) => {
                  const chore = chores.find((c) => c.id === sub.chore_id);
                  const submittedKid = kids.find(
                    (k) => k.id === sub.submitted_by
                  );
                  const statusChip =
                    sub.parent_override === 'approved'
                      ? { label: 'Approved', tone: 'pass' as const }
                      : sub.parent_override === 'rejected'
                        ? { label: 'Try again', tone: 'warn' as const }
                        : sub.ai_verdict === 'pass'
                          ? { label: 'AI: pass', tone: 'pass' as const }
                          : sub.ai_verdict === 'needs_work'
                            ? { label: 'AI: needs work', tone: 'warn' as const }
                            : { label: 'Pending', tone: 'pending' as const };
                  const chipBg =
                    statusChip.tone === 'pass'
                      ? theme.accentSoft
                      : statusChip.tone === 'warn'
                        ? '#F3E8D6'
                        : theme.backgroundElement;
                  const chipFg =
                    statusChip.tone === 'pass'
                      ? theme.accent
                      : statusChip.tone === 'warn'
                        ? '#8A5A1F'
                        : theme.textSecondary;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => router.push(`/app/submissions/${sub.id}`)}
                      style={[
                        styles.submissionRow,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText type="default">
                          {submittedKid?.display_name ?? 'A kid'} —{' '}
                          {chore?.title ?? 'a chore'}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted">
                          {new Date(sub.submitted_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: chipBg, borderColor: theme.border },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          style={{ color: chipFg }}
                        >
                          {statusChip.label}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        View →
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function AddKidRow({
  name,
  age,
  profiles,
  onChangeName,
  onChangeAge,
  onChangeProfiles,
  onSubmit,
  disabled,
  error,
  variant = 'block',
}: {
  name: string;
  age: string;
  profiles: SupportProfile[];
  onChangeName: (v: string) => void;
  onChangeAge: (v: string) => void;
  onChangeProfiles: (v: SupportProfile[]) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
  variant?: 'block' | 'inline';
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.addRow,
        variant === 'inline' && { marginTop: 0 },
        { flexDirection: 'column', gap: Spacing.three },
      ]}
    >
      <View style={styles.addRowFields}>
        <TextField
          label={variant === 'inline' ? "Kid's name" : "Add a kid — name"}
          value={name}
          onChangeText={onChangeName}
          placeholder="e.g. Theo"
          autoComplete="off"
          autoCorrect={false}
          style={{ minWidth: 180 }}
        />
        <TextField
          label="Age *"
          value={age}
          onChangeText={onChangeAge}
          placeholder="9"
          keyboardType="number-pad"
          autoComplete="off"
          autoCorrect={false}
          style={{ minWidth: 80 }}
          hint="Required — sets the starter chores and developmental tone."
        />
      </View>

      {/* Optional support profiles (PRD §8A). Parent-facing only. Pick
          all that apply — friendlier framing than the old single-pick
          "neurodivergent?" enum (Susan QA, June 4). */}
      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Do any of these apply? (optional, pick all that fit)
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          We use what you tell us to tune the suggestions just for you.
          Nothing shows up on the kid's side of the app.
        </ThemedText>
        <View style={styles.contextRow}>
          {PROFILE_OPTIONS.map((opt) => {
            const isActive = profiles.includes(opt.value);
            return (
              <Pressable
                key={opt.value}
                onPress={() =>
                  onChangeProfiles(
                    isActive
                      ? profiles.filter((p) => p !== opt.value)
                      : [...profiles, opt.value]
                  )
                }
                style={({ pressed }) => [
                  styles.contextChip,
                  {
                    borderColor: isActive ? theme.accent : theme.border,
                    backgroundColor: isActive
                      ? theme.accentSoft
                      : pressed
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: isActive ? theme.accent : theme.text }}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.addCta}>
        <BrandButton
          label={disabled ? 'Adding…' : 'Add kid'}
          onPress={onSubmit}
          disabled={disabled}
        />
      </View>

      {error && (
        <ThemedText type="small" style={{ color: '#B23A48', width: '100%' }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

/**
 * Per-kid nudge button + coaching callout. Lives at the bottom of each
 * kid card on the parent dashboard.
 *
 * MVP behavior:
 *   - Tap the button → log a nudge row, bump the local count.
 *   - When count >= NUDGE_METACOGNITION_THRESHOLD, render a soft callout
 *     above the button: "You've nudged {kid} N times today. Want to try
 *     a different approach?"
 *   - Cross-device push to the kid's device is deferred to Beta (see
 *     docs/engineering-defaults.md + PRD §9.13). In v0 the log itself
 *     is the value — it powers the metacognition + the kid-initiated
 *     metric.
 */
/**
 * Per-chore row on the parent dashboard. Tap the row to open the chore
 * detail (configure reference photo, tips, etc.). Tap the small "×" on
 * the right to delete — first tap turns the row into a confirm prompt
 * (Delete / Cancel), second tap to "Delete" actually deletes. No native
 * dialog, no modal — works on web AND mobile.
 */
function ChoreRow({
  chore,
  subsCount,
  hasRef,
  theme,
  onOpen,
  onDeleted,
}: {
  chore: { id: string; title: string };
  subsCount: number;
  hasRef: boolean;
  theme: ReturnType<typeof useTheme>;
  onOpen: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', chore.id);
      if (error) throw error;
      await onDeleted();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('delete chore failed:', err);
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View
      style={[
        styles.choreRow,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <Pressable
        onPress={onOpen}
        disabled={confirming}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}
      >
        <View style={{ flex: 1 }}>
          <ThemedText type="default">{chore.title}</ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            {subsCount === 0
              ? 'No submissions yet'
              : `${subsCount} submission${subsCount === 1 ? '' : 's'}`}
            {hasRef ? ' · reference set' : ' · no reference yet'}
          </ThemedText>
        </View>
        {!confirming && (
          <ThemedText type="small" themeColor="textSecondary">
            {hasRef ? 'Edit →' : 'Set up →'}
          </ThemedText>
        )}
      </Pressable>

      {confirming ? (
        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.two,
            alignItems: 'center',
            marginLeft: Spacing.two,
          }}
        >
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={{
              paddingHorizontal: Spacing.three,
              paddingVertical: Spacing.one,
              borderRadius: Radius.pill,
              backgroundColor: '#B23A48',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <ThemedText
              type="smallBold"
              style={{ color: 'white' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setConfirming(false)}
            disabled={deleting}
            hitSlop={6}
          >
            <ThemedText type="small" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setConfirming(true)}
          hitSlop={10}
          style={{
            paddingHorizontal: Spacing.two,
            paddingVertical: Spacing.one,
            marginLeft: Spacing.one,
          }}
          accessibilityLabel={`Delete chore: ${chore.title}`}
        >
          <ThemedText
            type="default"
            style={{ color: theme.textMuted, fontSize: 20, lineHeight: 22 }}
          >
            ×
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function NudgeRow({
  kidId,
  kidName,
  familyId,
  parentId,
  theme,
}: {
  kidId: string;
  kidName: string;
  familyId: string;
  parentId: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const { count, bump } = useNudgeCount(kidId);
  const [busy, setBusy] = useState(false);
  const overThreshold = count >= NUDGE_METACOGNITION_THRESHOLD;

  const onNudge = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await recordNudge({ familyId, parentId, kidId });
      bump();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.nudgeRow}>
      {overThreshold && (
        <View
          style={[
            styles.nudgeCallout,
            { backgroundColor: '#FBF2EE', borderColor: '#D6A89E' },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{
              color: '#8A4439',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            A gentle note
          </ThemedText>
          <ThemedText type="default" themeColor="text">
            You've nudged {kidName} {count} times today. When nudges pile
            up, they tend to stop landing. Want to try a different
            approach? The coaching library has paired examples — same
            moment, two ways.
          </ThemedText>
        </View>
      )}

      <View style={styles.nudgeButtonRow}>
        <BrandButton
          variant="ghost"
          label={
            busy
              ? 'Nudging…'
              : count === 0
                ? 'Gentle nudge'
                : `Gentle nudge (${count} today)`
          }
          onPress={onNudge}
          disabled={busy}
        />
      </View>
    </View>
  );
}

function PulseStat({
  theme,
  value,
  label,
  emoji,
}: {
  theme: ReturnType<typeof useTheme>;
  value: string;
  label: string;
  emoji?: string;
}) {
  return (
    <View style={styles.pulseStat}>
      <View style={styles.pulseStatValueRow}>
        {emoji ? (
          <ThemedText type="default" style={{ fontSize: 28 }}>
            {emoji}
          </ThemedText>
        ) : null}
        <ThemedText
          type="default"
          style={{
            fontSize: 36,
            lineHeight: 40,
            fontWeight: '700',
            color: theme.text,
          }}
        >
          {value}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textMuted">
        {label}
      </ThemedText>
    </View>
  );
}

function Card({
  theme,
  tone,
  children,
}: {
  theme: ReturnType<typeof useTheme>;
  tone: 'elevated' | 'info';
  children: React.ReactNode;
}) {
  const bg = tone === 'info' ? theme.accentSoft : theme.backgroundElement;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: theme.border },
      ]}
    >
      {children}
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
    // Allow wrapping when the logo + buttons can't fit on one row (very
    // narrow phones, accessibility text sizes). Buttons drop to a new row
    // beneath the logo instead of being clipped off the right edge.
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  wordmark: { letterSpacing: 0.5 },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  title: { marginTop: Spacing.one },
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.four,
  },
  cardTitle: { marginBottom: Spacing.one },
  kidHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  kidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  rewardChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  nudgeRow: { marginTop: Spacing.three, gap: Spacing.three },
  nudgeCallout: {
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  nudgeButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  rewardChipEmoji: { fontSize: 16 },
  statusChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginRight: Spacing.two,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  awaitingChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pulseStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  pulseStat: {
    flexGrow: 1,
    minWidth: 140,
    gap: 4,
  },
  pulseStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pulseKidsList: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  pulseKidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pulseBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  pulseBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  pulseHopsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  choresList: { gap: Spacing.two },
  choreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    flexWrap: 'wrap',
    marginTop: Spacing.three,
  },
  addRowFields: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  contextChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  addCta: { paddingBottom: Spacing.half },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.four,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addKidInline: { flex: 1, minWidth: 280 },
  submissionsList: { gap: Spacing.two },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.three,
  },
});
