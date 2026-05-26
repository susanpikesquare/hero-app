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

  // Pre-select all suggestions that haven't already been added for this kid.
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!kid) return;
    const next: Record<string, boolean> = {};
    for (const s of bucket.chores) {
      next[s.title] = !existingTitlesLower.has(s.title.toLowerCase());
    }
    setSelected(next);
    // bucket changes when age changes; existingTitlesLower changes when
    // chores reload — both should re-seed the selection.
  }, [bucket, existingTitlesLower, kid]);

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
    }[] = [];
    for (const s of bucket.chores) {
      if (selected[s.title]) {
        toCreate.push({
          title: s.title,
          kind: s.kind,
          tips: s.tips,
          verification: s.verification,
        });
      }
    }
    for (const c of customChores) {
      toCreate.push({
        title: c.title,
        kind: 'custom',
        tips: [],
        verification: 'photo',
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
              shows social/emotional/cognitive expectations for kids with ADHD
              at this age plus how that shapes the chore-picking decision. */}
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
            <ThemedText type="small" themeColor="textMuted">
              Tap to deselect anything that doesn’t fit your home.
            </ThemedText>

            <View style={styles.suggList}>
              {bucket.chores.map((s) => (
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

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Add your own
            </BrandHeading>
            <ThemedText type="small" themeColor="textMuted">
              Something specific to your home? Add it below.
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
  suggList: { gap: Spacing.two, marginTop: Spacing.two },
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
