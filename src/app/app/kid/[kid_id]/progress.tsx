import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { CalendarHeatmap } from '@/components/calendar-heatmap';
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
  currentStreak,
  dailyBuckets,
  longestStreak,
  perChoreBreakdown,
  weeklyBuckets,
  winRate,
} from '@/lib/progress-stats';
import {
  descriptorFor,
  earnedCountFor,
  latestBadge,
  nextBadge,
} from '@/lib/rewards';
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

const WINDOW_DAYS = 91; // 13 weeks

export default function KidProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kid_id: string }>();
  const { session } = useAuth();
  const { kids, family, loading: famLoading } = useFamily(!!session);
  const { chores, submissions, loading: choresLoading } = useChores(!!session);

  const kid = kids.find((k) => k.id === params.kid_id) ?? null;
  const descriptor = descriptorFor(family?.reward_mode);

  const buckets = useMemo(
    () => (kid ? dailyBuckets(submissions, kid.id, WINDOW_DAYS) : []),
    [submissions, kid]
  );
  const weeks = useMemo(() => weeklyBuckets(buckets), [buckets]);
  const totalEarned = kid ? earnedCountFor(kid.id, submissions, chores) : 0;
  const badge = latestBadge(totalEarned);
  const next = nextBadge(totalEarned);
  const longest = longestStreak(buckets);
  const current = currentStreak(buckets);
  const rate = winRate(buckets);
  const choreBreakdown = useMemo(
    () => (kid ? perChoreBreakdown(submissions, kid.id, WINDOW_DAYS) : new Map()),
    [submissions, kid]
  );

  if (famLoading || choresLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading progress…
        </ThemedText>
      </View>
    );
  }

  if (!kid) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Couldn&rsquo;t find that kid.
        </ThemedText>
        <View style={{ height: Spacing.three }} />
        <BrandButton label="Back to dashboard" onPress={() => router.replace('/app')} />
      </View>
    );
  }

  const winsThisWindow = buckets.reduce((sum, b) => sum + b.wins, 0);
  const totalThisWindow = buckets.reduce((sum, b) => sum + b.total, 0);
  const ratePct = Math.round(rate * 100);

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
              {kid.display_name}
              {kid.age != null ? ` · Age ${kid.age}` : ''} · Progress
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {kid.display_name}&rsquo;s last 13 weeks
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              A look at chore wins, streaks, and the days that landed. Tap any
              square to see what happened.
            </ThemedText>
          </View>

          {/* Summary stats */}
          <View style={styles.statsGrid}>
            <StatCard
              theme={theme}
              tone="primary"
              eyebrow={`Total ${descriptor.unitPlural}`}
              value={String(totalEarned)}
              caption={badge ? `Latest badge: ${badge.emoji} ${badge.label}` : 'No badges yet'}
            />
            <StatCard
              theme={theme}
              eyebrow="Win rate"
              value={`${ratePct}%`}
              caption={
                totalThisWindow > 0
                  ? `${winsThisWindow} wins of ${totalThisWindow} submissions in 91 days`
                  : 'No submissions yet'
              }
            />
            <StatCard
              theme={theme}
              eyebrow="Longest streak"
              value={`${longest} day${longest === 1 ? '' : 's'}`}
              caption={
                current > 0
                  ? `Currently on a ${current}-day run`
                  : 'No active streak'
              }
            />
            <StatCard
              theme={theme}
              eyebrow="Next badge"
              value={next ? `${next.threshold - totalEarned} to go` : 'All unlocked'}
              caption={
                next
                  ? `${next.emoji} ${next.label} unlocks at ${next.threshold}`
                  : 'Hundo Hero achieved.'
              }
            />
          </View>

          {/* Heatmap */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Daily activity
            </BrandHeading>
            <ThemedText type="small" themeColor="textMuted">
              Each square is a day. Greener = more wins. Empty = nothing
              submitted that day.
            </ThemedText>

            <View style={{ marginTop: Spacing.three }}>
              <CalendarHeatmap
                weeks={weeks}
                metric="wins"
                unitSingular={descriptor.unitSingular || 'win'}
                unitPlural={descriptor.unitPlural || 'wins'}
              />
            </View>
          </View>

          {/* Per-chore breakdown */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              By chore (last 91 days)
            </BrandHeading>

            {(() => {
              const kidChores = chores.filter((c) => c.kid_id === kid.id);
              if (kidChores.length === 0) {
                return (
                  <ThemedText type="default" themeColor="textSecondary">
                    No chores set up yet.
                  </ThemedText>
                );
              }
              return (
                <View style={styles.choreList}>
                  {kidChores.map((chore) => {
                    const stats = choreBreakdown.get(chore.id) ?? {
                      total: 0,
                      wins: 0,
                    };
                    const choreRate =
                      stats.total > 0
                        ? Math.round((stats.wins / stats.total) * 100)
                        : 0;
                    return (
                      <View
                        key={chore.id}
                        style={[
                          styles.choreRow,
                          { backgroundColor: theme.background, borderColor: theme.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <ThemedText type="default" style={{ fontWeight: '600' }}>
                            {chore.title}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textMuted">
                            {stats.total === 0
                              ? 'No submissions in this window'
                              : `${stats.wins} of ${stats.total} submissions counted as a win`}
                          </ThemedText>
                        </View>
                        <View
                          style={[
                            styles.choreRate,
                            {
                              backgroundColor:
                                stats.total === 0
                                  ? theme.background
                                  : choreRate >= 70
                                    ? theme.accentSoft
                                    : '#F3E8D6',
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <ThemedText
                            type="smallBold"
                            style={{
                              color:
                                stats.total === 0
                                  ? theme.textMuted
                                  : choreRate >= 70
                                    ? theme.accent
                                    : '#8A5A1F',
                            }}
                          >
                            {stats.total === 0 ? '—' : `${choreRate}%`}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({
  theme,
  eyebrow,
  value,
  caption,
  tone = 'plain',
}: {
  theme: ReturnType<typeof useTheme>;
  eyebrow: string;
  value: string;
  caption: string;
  tone?: 'plain' | 'primary';
}) {
  const bg = tone === 'primary' ? theme.accentSoft : theme.backgroundElement;
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: bg, borderColor: theme.border },
      ]}
    >
      <ThemedText
        type="smallBold"
        themeColor={tone === 'primary' ? 'accent' : 'textSecondary'}
        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {eyebrow}
      </ThemedText>
      <ThemedText type="title" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textMuted">
        {caption}
      </ThemedText>
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
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth + Spacing.seven },
  title: { marginTop: Spacing.one },
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 200,
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 36,
    lineHeight: 40,
    marginVertical: 2,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.two,
  },
  cardTitle: { marginBottom: Spacing.one },
  choreList: { gap: Spacing.two, marginTop: Spacing.two },
  choreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.three,
  },
  choreRate: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
});
