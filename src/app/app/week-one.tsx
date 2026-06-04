/**
 * End-of-week-1 conflict check-in (Workbook Q2.1).
 *
 * Erica's success criterion for week one includes, in part, "There was
 * a reduction in conflict / arguing." The product can't measure conflict
 * directly — but a single Likert question to the parent at the end of
 * week one closes the loop on the "reduced household friction"
 * north-star outcome (PRD §3) that would otherwise be unmeasurable.
 *
 * Surfaces once: when the family is ≥7 days past `parent_welcomed_at`
 * and `week_one_checkin_answer` is still NULL. The /app/_layout.tsx
 * gate redirects here in that window. Answering writes the answer and
 * the timestamp and forwards back to the dashboard.
 *
 * Tone: encouraging, not interrogating. Even a "more conflict" answer
 * gets a warm response — it's a real signal and we honor it.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import type { Database } from '@/lib/database.types';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/lib/use-family';

type Answer = Database['public']['Enums']['week_one_answer'];

const OPTIONS: { value: Answer; label: string; hint: string }[] = [
  {
    value: 'less_conflict',
    label: 'Less conflict',
    hint:
      'This week had less of the daily friction than the week before. Maybe noticeably, maybe just enough.',
  },
  {
    value: 'about_the_same',
    label: 'About the same',
    hint:
      "Things felt roughly the same. Not worse, not really better — early days.",
  },
  {
    value: 'more_conflict',
    label: 'More conflict',
    hint:
      "Tougher week. We want to know — it helps us learn what is and isn't working.",
  },
];

export default function WeekOneCheckinScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { family, loading } = useFamily(!!session);
  const [selected, setSelected] = useState<Answer | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!family || !selected || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({
          week_one_checkin_answer: selected,
          week_one_checkin_answered_at: new Date().toISOString(),
        })
        .eq('id', family.id);
      if (error) {
        console.error('Could not save week-1 answer:', error);
      }
      router.replace('/app');
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    // Even "skip" should mark the check-in as shown so the parent doesn't
    // hit it again. We just don't store an answer.
    if (!family || saving) return;
    setSaving(true);
    try {
      await supabase
        .from('families')
        .update({
          week_one_checkin_answered_at: new Date().toISOString(),
        })
        .eq('id', family.id);
      router.replace('/app');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !family) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          One moment…
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
          <View style={styles.logoBlock}>
            <BrandLogo height={56} />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              One week in
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Did this week feel any different than the week before?
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              A single question. There are no wrong answers — we ask
              because it helps us know what to build next.
            </ThemedText>
          </View>

          <View style={styles.options}>
            {OPTIONS.map((opt) => {
              const isActive = selected === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelected(opt.value)}
                  style={({ pressed }) => [
                    styles.option,
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
                  <View style={styles.optionHeader}>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: isActive ? theme.accent : theme.text,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                    {isActive && (
                      <ThemedText type="smallBold" style={{ color: theme.accent }}>
                        ✓ Selected
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText type="default" themeColor="textSecondary">
                    {opt.hint}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ctaRow}>
            <BrandButton
              label={saving ? 'Saving…' : 'Submit'}
              onPress={submit}
              disabled={!selected || saving}
            />
            <BrandButton variant="ghost" label="Skip" onPress={skip} disabled={saving} />
          </View>

          <ThemedText type="small" themeColor="textMuted" style={styles.footer}>
            One question. We won't ask again this week.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { width: '100%', alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eight,
    gap: Spacing.five,
    alignItems: 'flex-start',
  },
  logoBlock: { alignSelf: 'flex-start' },
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth + Spacing.eight },
  title: { marginTop: Spacing.one },
  lead: { fontSize: 17, lineHeight: 28, maxWidth: ReadableContentWidth },
  options: { gap: Spacing.three, maxWidth: ReadableContentWidth + Spacing.seven, width: '100%' },
  option: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  footer: { marginTop: Spacing.two, maxWidth: ReadableContentWidth },
});
