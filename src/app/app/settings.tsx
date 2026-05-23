/**
 * Family-level settings. v0 surface is just the reward mode picker —
 * the page exists so future settings (notifications, privacy, integrations)
 * can land here without rewriting nav.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import {
  MaxContentWidth,
  Radius,
  ReadableContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { MODE_DESCRIPTORS, type RewardMode } from '@/lib/rewards';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/lib/use-family';

const MODE_ORDER: RewardMode[] = ['hops', 'stars', 'badges', 'off'];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { family, loading, reload } = useFamily(!!session);

  const [mode, setMode] = useState<RewardMode>('hops');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (family) {
      setMode((family.reward_mode as RewardMode) ?? 'hops');
    }
  }, [family]);

  const save = async () => {
    if (!family) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { error: updErr } = await supabase
        .from('families')
        .update({ reward_mode: mode })
        .eq('id', family.id);
      if (updErr) throw updErr;
      await reload();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading settings…
        </ThemedText>
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
              label="← Dashboard"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {family?.name ?? 'Your family'} · Settings
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Family settings
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              Tune how rewards work for your kids. You can change this anytime.
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Reward mode
            </BrandHeading>
            <ThemedText type="small" themeColor="textMuted">
              How each completed chore celebrates with your kid.
            </ThemedText>

            <View style={styles.optionsList}>
              {MODE_ORDER.map((m) => {
                const d = MODE_DESCRIPTORS[m];
                const selected = m === mode;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: selected
                          ? theme.accentSoft
                          : theme.background,
                        borderColor: selected ? theme.accent : theme.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
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
                    <View style={styles.optionBody}>
                      <View style={styles.optionTitleRow}>
                        {!!d.emoji && (
                          <ThemedText type="default" style={styles.optionEmoji}>
                            {d.emoji}
                          </ThemedText>
                        )}
                        <ThemedText type="default" style={{ fontWeight: '600' }}>
                          {d.label}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {d.blurb}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {error && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {error}
              </ThemedText>
            )}
            {saved && !error && (
              <ThemedText type="small" themeColor="accent">
                Saved ✓
              </ThemedText>
            )}

            <View style={styles.actions}>
              <BrandButton
                label={saving ? 'Saving…' : 'Save reward mode'}
                onPress={save}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
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
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  cardTitle: { marginBottom: Spacing.one },
  optionsList: { gap: Spacing.two, marginTop: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  optionBody: { flex: 1, gap: 2 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  optionEmoji: { fontSize: 22 },
  actions: { marginTop: Spacing.two, alignItems: 'flex-start' },
});
