import { useRouter } from 'expo-router';
import { useState } from 'react';
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
  descriptorFor,
  earnedCountFor,
  latestBadge,
} from '@/lib/rewards';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { family, parent, kids, loading: famLoading, error: famError, addKid } =
    useFamily(!!session);
  const { chores, submissions, loading: choresLoading } = useChores(!!session);

  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
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
    if (trimmedAge) {
      const parsed = Number.parseInt(trimmedAge, 10);
      if (!Number.isFinite(parsed) || parsed < 4 || parsed > 18) {
        setAddError("Age should be a number between 4 and 18 — we'll suggest chores for it.");
        return;
      }
      age = parsed;
    } else {
      setAddError("Add your kid's age so we can suggest age-appropriate chores.");
      return;
    }
    setAdding(true);
    try {
      const newKidId = await addKid({ displayName: newKidName, age });
      setNewKidName('');
      setNewKidAge('');
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
              chore, then hand the device over and tap &ldquo;Hand to&nbsp;…&rdquo;
              so they can submit a photo.
            </ThemedText>
          </View>

          {famError && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {famError}
            </ThemedText>
          )}

          {/* Kids + their chores */}
          {kids.length === 0 ? (
            <Card theme={theme} tone="elevated">
              <BrandHeading level="h2" style={styles.cardTitle}>
                Add your first kid
              </BrandHeading>
              <ThemedText type="default" themeColor="textSecondary">
                You haven&rsquo;t added anyone yet. Type a name and tap Add.
              </ThemedText>
              <AddKidRow
                name={newKidName}
                age={newKidAge}
                onChangeName={setNewKidName}
                onChangeAge={setNewKidAge}
                onSubmit={onAddKid}
                disabled={adding}
                error={addError}
              />
            </Card>
          ) : (
            kids.map((kid) => {
              const kidChores = choresForKid(chores, kid.id);
              const earned = earnedCountFor(kid.id, submissions);
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
                          <Pressable
                            key={chore.id}
                            onPress={() => router.push(`/app/chores/${chore.id}`)}
                            style={[
                              styles.choreRow,
                              {
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <ThemedText type="default">{chore.title}</ThemedText>
                              <ThemedText type="small" themeColor="textMuted">
                                {subs.length === 0
                                  ? 'No submissions yet'
                                  : `${subs.length} submission${subs.length === 1 ? '' : 's'}`}
                                {hasRef ? ' · reference set' : ' · no reference yet'}
                              </ThemedText>
                            </View>
                            <ThemedText type="small" themeColor="textSecondary">
                              {hasRef ? 'Edit →' : 'Set up →'}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
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
                  onChangeName={setNewKidName}
                  onChangeAge={setNewKidAge}
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
  onChangeName,
  onChangeAge,
  onSubmit,
  disabled,
  error,
  variant = 'block',
}: {
  name: string;
  age: string;
  onChangeName: (v: string) => void;
  onChangeAge: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
  variant?: 'block' | 'inline';
}) {
  return (
    <View style={[styles.addRow, variant === 'inline' && { marginTop: 0 }]}>
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
        label="Age"
        value={age}
        onChangeText={onChangeAge}
        placeholder="9"
        keyboardType="number-pad"
        autoComplete="off"
        autoCorrect={false}
        style={{ minWidth: 80 }}
      />
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
