/**
 * Initial chore-setup screen, shown right after a parent adds a kid.
 *
 * - Loads age-appropriate suggestions from src/lib/chore-suggestions.ts
 * - Pre-selects all suggestions; parent can deselect any
 * - Lets parent add custom chores inline
 * - On Save: bulk-inserts chores for this kid, redirects to dashboard
 *
 * Reachable later by deep link, e.g. /app/kid/<id>/setup — useful if the
 * parent wants to bring up the suggestion list again for an existing kid.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeGuidanceCard } from '@/components/age-guidance-card';
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
import { useAuth } from '@/lib/auth-context';
import { articleForAge } from '@/lib/articles';
import {
  type ChoreSuggestion,
  suggestChoresForAge,
} from '@/lib/chore-suggestions';
import { supabase } from '@/lib/supabase';
import { choresForKid, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

type CustomChore = { id: string; title: string };

export default function KidSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kid_id: string }>();
  const { session } = useAuth();
  const { family, kids, loading: famLoading } = useFamily(!!session);
  const { chores, reload } = useChores(!!session);

  const kid = kids.find((k) => k.id === params.kid_id) ?? null;
  const existingTitlesLower = useMemo(
    () =>
      new Set(
        choresForKid(chores, params.kid_id ?? '').map((c) =>
          c.title.toLowerCase()
        )
      ),
    [chores, params.kid_id]
  );

  const bucket = useMemo(
    () => suggestChoresForAge(kid?.age ?? null),
    [kid?.age]
  );
  const ageArticle = useMemo(
    () => articleForAge(kid?.age ?? null),
    [kid?.age]
  );

  // Group bucket suggestions into two product-meaningful categories
  // (Susan QA, 2026-06-08). Personal-habit chores teach a kid to take
  // care of themselves; household chores teach contribution. Showing
  // them mixed in one long list buried the distinction.
  // The underlying chore-suggestions data is already tagged by `kind`
  // — self-care chores are no-photo checklist items (brush teeth,
  // shower, deodorant); everything else (bedroom, bathroom, kitchen,
  // laundry, living, entry, pet, outdoor) is a household responsibility.
  const habitChores = useMemo(
    () => bucket.chores.filter((c) => c.kind === 'self-care'),
    [bucket]
  );
  const householdChores = useMemo(
    () => bucket.chores.filter((c) => c.kind !== 'self-care'),
    [bucket]
  );

  // Start with EVERYTHING unchecked so the parent makes a deliberate
  // pick rather than inheriting "all of them" (Susan QA, 2026-06-08:
  // pre-selecting everything pushed parents toward overload — the
  // ceiling warning fired immediately on render, which was scolding).
  // The recommended count is surfaced as a prompt above the list
  // instead.
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!kid) return;
    const next: Record<string, boolean> = {};
    for (const s of bucket.chores) {
      next[s.title] = false;
    }
    setSelected(next);
    // bucket changes when age changes; reset to all-unchecked.
  }, [bucket, kid]);

  const [customChores, setCustomChores] = useState<CustomChore[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSuggestion = (title: string) => {
    setSelected((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const addCustom = () => {
    const t = customDraft.trim();
    if (!t) return;
    if (
      customChores.some((c) => c.title.toLowerCase() === t.toLowerCase()) ||
      existingTitlesLower.has(t.toLowerCase()) ||
      bucket.chores.some(
        (s) => s.title.toLowerCase() === t.toLowerCase() && selected[s.title]
      )
    ) {
      setError(`"${t}" is already on the list.`);
      return;
    }
    setError(null);
    setCustomChores((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: t },
    ]);
    setCustomDraft('');
  };

  const removeCustom = (id: string) => {
    setCustomChores((prev) => prev.filter((c) => c.id !== id));
  };

  const save = async () => {
    setError(null);
    if (!family || !kid) return;
    // Pull the pre-drafted coaching tips through from the suggestion library
    // so the kid sees them on the chore tile without the parent typing
    // anything. Same for verification_kind — self-care chores like
    // "brush teeth" come in as 'checklist' (no photo). Custom chores
    // start with no tips and default to 'photo'.
    const toCreate: {
      title: string;
      kind: string;
      tips: string[];
      verification: 'photo' | 'checklist';
      /** Bonus chores go in as is_optional=true so they show under the
       *  kid's "Extras" section rather than the daily required list. */
      isOptional: boolean;
    }[] = [];
    for (const s of bucket.chores) {
      if (selected[s.title]) {
        toCreate.push({
          title: s.title,
          kind: s.kind,
          tips: s.tips,
          verification: s.verification,
          isOptional: false,
        });
      }
    }
    for (const c of customChores) {
      toCreate.push({
        title: c.title,
        kind: 'custom',
        tips: [],
        verification: 'photo',
        // Custom additions on this screen are framed as "bonus tasks the
        // kid can take on by choice" (Susan QA, 2026-06-08). The dashboard
        // → New chore form still creates required chores by default;
        // this is just the setup-flow convention.
        isOptional: true,
      });
    }
    if (toCreate.length === 0) {
      // Nothing to save — go straight to the dashboard.
      router.replace('/app');
      return;
    }
    setSaving(true);
    try {
      const rows = toCreate.map((c) => ({
        family_id: family.id,
        kid_id: kid.id,
        title: c.title,
        kind: c.kind,
        coaching_tips: c.tips,
        verification_kind: c.verification,
        is_optional: c.isOptional,
      }));
      const { error: insertErr } = await supabase.from('chores').insert(rows);
      if (insertErr) throw insertErr;
      await reload();
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save chores.');
    } finally {
      setSaving(false);
    }
  };

  if (famLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </View>
    );
  }

  if (!kid) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          We couldn’t find that kid.
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
            <BrandLogo height={96} />
            <BrandButton
              variant="ghost"
              label="Skip for now"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {kid.display_name}
              {kid.age != null ? ` · Age ${kid.age}` : ''} · Set up chores
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Pick the chores you want {kid.display_name} to start with.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              {bucket.framing} You can change any of this later.
            </ThemedText>
            {ageArticle && (
              <Pressable
                onPress={() => router.push(`/app/articles/${ageArticle.slug}`)}
                style={({ pressed }) => [
                  styles.articleCallout,
                  {
                    backgroundColor: pressed ? theme.backgroundSelected : theme.infoSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor="info"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Coaching for parents
                </ThemedText>
                <ThemedText type="default" themeColor="text" style={{ marginTop: 4 }}>
                  Read: <ThemedText type="default" style={{ fontWeight: '600' }}>{ageArticle.title}</ThemedText>
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {ageArticle.blurb}
                </ThemedText>
              </Pressable>
            )}
          </View>

          {/* Calibrate parent expectations BEFORE they pick chores. The card
              shows social/emotional/cognitive expectations for kids at this
              age plus how that shapes the chore-picking decision. When the
              kid's neurodivergence_context is set, a neurodivergent-lens
              callout surfaces below as well. */}
          <AgeGuidanceCard age={kid.age} kidName={kid.display_name} />

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Suggested for {bucket.label.toLowerCase()}
            </BrandHeading>
            <ThemedText type="default" themeColor="text" style={{ lineHeight: 24 }}>
              {(() => {
                const { min, max } = bucket.dailyTaskCeiling;
                const range = min === max ? `${min}` : `${min}–${max}`;
                return `Published guidance suggests ${range} daily chores at ${bucket.label.toLowerCase()}. Pick from the two groups below — you can always add more later.`;
              })()}
            </ThemedText>

            {/* Group 1 — Personal habits (self-care). Routines a kid does
                for themselves. No-photo checklist verification. */}
            {habitChores.length > 0 && (
              <View style={styles.suggGroup}>
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Personal habits
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  Self-care routines — brushing, showering, deodorant.
                  Kid taps Done; no photo.
                </ThemedText>
                <View style={styles.suggList}>
                  {habitChores.map((s) => (
                    <SuggestionRow
                      key={s.title}
                      s={s}
                      selected={!!selected[s.title]}
                      onToggle={() => toggleSuggestion(s.title)}
                      alreadyAdded={existingTitlesLower.has(s.title.toLowerCase())}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Group 2 — Around the house. Contribution chores that show
                what "helping out" looks like in your home. */}
            {householdChores.length > 0 && (
              <View style={styles.suggGroup}>
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Around the house
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  Contributions to the household — bedroom, bathroom,
                  kitchen, laundry. Photo verification.
                </ThemedText>
                <View style={styles.suggList}>
                  {householdChores.map((s) => (
                    <SuggestionRow
                      key={s.title}
                      s={s}
                      selected={!!selected[s.title]}
                      onToggle={() => toggleSuggestion(s.title)}
                      alreadyAdded={existingTitlesLower.has(s.title.toLowerCase())}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Provenance — show the parent the trusted sources the
                suggestions in this bucket draw from. Same set as the
                corresponding article. */}
            {bucket.sources && bucket.sources.length > 0 && (
              <View style={styles.sourcesBlock}>
                <ThemedText
                  type="smallBold"
                  themeColor="textMuted"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Drawn from
                </ThemedText>
                {bucket.sources.map((src, i) => (
                  <ThemedText
                    key={i}
                    type="small"
                    themeColor="textSecondary"
                    style={{ lineHeight: 22 }}
                  >
                    · {src}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Bonus tasks (by choice)
            </BrandHeading>
            <ThemedText type="small" themeColor="textMuted">
              Extras your kid can take on when they want to — a project,
              a help-out, something specific to your home. These save as
              opt-in extras (they show in the kid’s Extras section, not
              the daily required list).
            </ThemedText>

            {customChores.length > 0 && (
              <View style={styles.customList}>
                {customChores.map((c) => (
                  <View
                    key={c.id}
                    style={[
                      styles.customRow,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <ThemedText type="default" style={{ flex: 1 }}>
                      {c.title}
                    </ThemedText>
                    <Pressable
                      onPress={() => removeCustom(c.id)}
                      style={({ pressed }) => [
                        styles.removeBtn,
                        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <ThemedText type="small" themeColor="textSecondary">
                        Remove
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.customInputRow}>
              <TextField
                label="New chore title"
                value={customDraft}
                onChangeText={setCustomDraft}
                placeholder="e.g. Walk the dog"
                autoComplete="off"
                autoCorrect={false}
                style={{ minWidth: 220 }}
              />
              <View style={styles.customAddCta}>
                <BrandButton
                  variant="ghost"
                  label="Add"
                  onPress={addCustom}
                  disabled={!customDraft.trim()}
                />
              </View>
            </View>
          </View>

          {error && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {error}
            </ThemedText>
          )}

          {/* Soft task-load warning (Workbook Q3.3). When the selected
              count plus pre-existing chores would exceed the
              age-appropriate ceiling published guidance suggests, surface
              a gentle inline note. Never blocking — parent can proceed. */}
          {(() => {
            const selectedCount =
              countSelections(selected, customChores) + existingTitlesLower.size;
            const ceiling = bucket.dailyTaskCeiling.max;
            if (selectedCount <= ceiling) return null;
            return (
              <View
                style={[
                  styles.warningCard,
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
                  Heads up
                </ThemedText>
                <ThemedText type="default" themeColor="text">
                  That’s {selectedCount} chores for {bucket.label.toLowerCase()}.
                  Published guidance generally suggests {bucket.dailyTaskCeiling.min}–{ceiling} at this age.
                  Going higher tends to break the contribution experience rather than build it — but you know your home best. You can proceed.
                </ThemedText>
              </View>
            );
          })()}

          <View style={styles.saveRow}>
            <BrandButton
              label={
                saving
                  ? 'Saving…'
                  : countSelections(selected, customChores) === 0
                    ? 'Skip and go to dashboard'
                    : `Save ${countSelections(selected, customChores)} chore${countSelections(selected, customChores) === 1 ? '' : 's'}`
              }
              onPress={save}
              disabled={saving}
            />
            <ThemedText type="small" themeColor="textMuted">
              You can add or remove chores anytime from the dashboard.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function SuggestionRow({
  s,
  selected,
  onToggle,
  alreadyAdded,
}: {
  s: ChoreSuggestion;
  selected: boolean;
  onToggle: () => void;
  alreadyAdded: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.suggRow,
        {
          backgroundColor: selected ? theme.accentSoft : theme.background,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: selected ? theme.accent : theme.textMuted,
            backgroundColor: selected ? theme.accent : 'transparent',
          },
        ]}
      >
        {selected && (
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            ✓
          </ThemedText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="default" style={{ fontWeight: '600' }}>
          {s.title}
          {alreadyAdded ? ' (already added)' : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {s.blurb}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function countSelections(
  selected: Record<string, boolean>,
  customChores: CustomChore[]
): number {
  return Object.values(selected).filter(Boolean).length + customChores.length;
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
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  cardTitle: { marginBottom: Spacing.one },
  suggGroup: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  suggList: { gap: Spacing.two, marginTop: Spacing.two },
  sourcesBlock: { marginTop: Spacing.four, gap: Spacing.one },
  warningCard: {
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  suggRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customList: { gap: Spacing.two, marginTop: Spacing.two },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  removeBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
  customAddCta: { paddingBottom: Spacing.half },
  saveRow: { gap: Spacing.two, alignItems: 'flex-start' },
  articleCallout: {
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    maxWidth: ReadableContentWidth,
    gap: 2,
  },
});
