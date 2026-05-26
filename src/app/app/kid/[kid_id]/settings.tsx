/**
 * Kid settings: edit display name + age, or delete the kid.
 *
 * Deleting cascades chores → submissions via the FK constraints we set up
 * in the original schema. Storage photos in `submissions/` and
 * `reference-photos/` are NOT auto-deleted (Storage objects don't have FKs
 * to public tables); they'll just be orphaned. For v0 that's fine —
 * private buckets, never served outside the family, and we can sweep them
 * with a cleanup job later.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/lib/use-family';

export default function KidSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kid_id: string }>();
  const { session } = useAuth();
  const { kids, loading, reload } = useFamily(!!session);

  const kid = kids.find((k) => k.id === params.kid_id) ?? null;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Kid join code state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateJoinCode = async () => {
    if (!kid) return;
    setCodeError(null);
    setCopied(false);
    setGeneratingCode(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc(
        'generate_kid_join_code',
        { p_kid_id: kid.id }
      );
      if (rpcErr) throw rpcErr;
      setGeneratedCode(data ?? null);
      await reload();
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Could not generate code.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyCode = async () => {
    if (!generatedCode) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!kid) return;
    setName(kid.display_name);
    setAge(kid.age != null ? String(kid.age) : '');
  }, [kid]);

  const save = async () => {
    setError(null);
    if (!kid) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name can't be empty.");
      return;
    }
    let nextAge: number | null = null;
    const trimmedAge = age.trim();
    if (trimmedAge) {
      const parsed = Number.parseInt(trimmedAge, 10);
      if (!Number.isFinite(parsed) || parsed < 4 || parsed > 18) {
        setError('Age should be a number between 4 and 18.');
        return;
      }
      nextAge = parsed;
    }
    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from('family_members')
        .update({ display_name: trimmedName, age: nextAge })
        .eq('id', kid.id);
      if (updateErr) throw updateErr;
      await reload();
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!kid) return;
    setError(null);
    setDeleting(true);
    try {
      const { error: deleteErr } = await supabase
        .from('family_members')
        .delete()
        .eq('id', kid.id);
      if (deleteErr) throw deleteErr;
      await reload();
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete kid.');
      setDeleting(false);
    }
  };

  if (loading) {
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
              label="← Dashboard"
              onPress={() => router.replace('/app')}
            />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {kid.display_name} · Settings
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Manage {kid.display_name}
            </BrandHeading>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Profile
            </BrandHeading>

            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              autoComplete="off"
              autoCorrect={false}
            />
            <TextField
              label="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              autoComplete="off"
              autoCorrect={false}
              hint="Used to suggest age-appropriate chores."
            />

            {error && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {error}
              </ThemedText>
            )}

            <View style={styles.actions}>
              <BrandButton
                label={saving ? 'Saving…' : 'Save changes'}
                onPress={save}
                disabled={saving || deleting}
              />
              <BrandButton
                variant="ghost"
                label="Cancel"
                onPress={() => router.replace('/app')}
                disabled={saving || deleting}
              />
            </View>
          </View>

          {/* Developmental frame — re-read anytime, especially helpful when
              the parent feels frustrated and needs to recalibrate against
              what's actually typical at this age. */}
          <AgeGuidanceCard age={kid.age} kidName={kid.display_name} />

          {/* Kid login */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              {kid.display_name}’s login
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              {kid.kid_joined_at
                ? `${kid.display_name} has joined the app on their own device (since ${new Date(kid.kid_joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}). Generate a new code if they're switching devices.`
                : `${kid.display_name} doesn't have their own login yet. Generate a join code, share it with them, and they can use the app on their own device.`}
            </ThemedText>

            {generatedCode ? (
              <View
                style={[
                  styles.codeCard,
                  { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor="accent"
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {kid.display_name}’s join code
                </ThemedText>
                <ThemedText
                  type="default"
                  style={[styles.codeMono, { color: theme.text }]}
                >
                  {generatedCode}
                </ThemedText>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: Spacing.three,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <BrandButton
                    label={copied ? '✓ Copied' : 'Copy code'}
                    onPress={copyCode}
                  />
                  <ThemedText type="small" themeColor="textMuted">
                    Expires in 24 hours
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  On {kid.display_name}’s device, open the Home Hero app
                  → tap <ThemedText type="smallBold">I’m a kid</ThemedText> →
                  enter this code.
                </ThemedText>
              </View>
            ) : null}

            {codeError && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {codeError}
              </ThemedText>
            )}

            <View style={styles.actions}>
              <BrandButton
                label={
                  generatingCode
                    ? 'Generating…'
                    : kid.kid_joined_at
                      ? 'Generate new code'
                      : 'Generate join code'
                }
                onPress={generateJoinCode}
                disabled={generatingCode || saving || deleting}
              />
            </View>
          </View>

          <View
            style={[
              styles.card,
              styles.dangerCard,
              { backgroundColor: '#F8E8E5', borderColor: '#E1B7B0' },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Remove {kid.display_name}
            </BrandHeading>
            <ThemedText type="default" themeColor="text">
              Deletes {kid.display_name} from your family, along with their
              chores and all submission photos they sent. This can’t be
              undone.
            </ThemedText>

            {confirmingDelete ? (
              <View style={styles.actions}>
                <Pressable
                  onPress={doDelete}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.dangerBtn,
                    { backgroundColor: pressed ? '#922a37' : '#B23A48' },
                  ]}
                >
                  <ThemedText
                    type="default"
                    style={{ color: '#fff', fontWeight: '600' }}
                  >
                    {deleting ? 'Deleting…' : `Yes, remove ${kid.display_name}`}
                  </ThemedText>
                </Pressable>
                <BrandButton
                  variant="ghost"
                  label="Keep them"
                  onPress={() => setConfirmingDelete(false)}
                  disabled={deleting}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setConfirmingDelete(true)}
                  style={({ pressed }) => [
                    styles.dangerBtnGhost,
                    {
                      borderColor: '#B23A48',
                      backgroundColor: pressed ? '#F4D6D2' : 'transparent',
                    },
                  ]}
                >
                  <ThemedText
                    type="default"
                    style={{ color: '#B23A48', fontWeight: '600' }}
                  >
                    Remove {kid.display_name}
                  </ThemedText>
                </Pressable>
              </View>
            )}
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
  header: { gap: Spacing.two, maxWidth: ReadableContentWidth },
  title: { marginTop: Spacing.one },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  cardTitle: { marginBottom: Spacing.one },
  dangerCard: {},
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
  dangerBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  dangerBtnGhost: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  codeCard: {
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  codeMono: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontWeight: '700',
    letterSpacing: 4,
  },
});
