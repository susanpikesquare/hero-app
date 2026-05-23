/**
 * Family settings — three stacked sections:
 *   - Account  (your login info, password, sign out)
 *   - Family   (family name editor)
 *   - Rewards  (per-family reward mode picker)
 *
 * Every form here is independently editable and only saves the section
 * you submit.
 */

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
import { useAuth } from '@/lib/auth-context';
import { MODE_DESCRIPTORS, type RewardMode } from '@/lib/rewards';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/lib/use-family';

const MODE_ORDER: RewardMode[] = ['hops', 'stars', 'badges', 'off'];
const MIN_PASSWORD = 8;

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { family, loading, reload } = useFamily(!!session);

  // --- Family name ---
  const [familyName, setFamilyName] = useState('');
  const [savingFamily, setSavingFamily] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familySaved, setFamilySaved] = useState(false);

  useEffect(() => {
    if (family) setFamilyName(family.name);
  }, [family]);

  const saveFamily = async () => {
    if (!family) return;
    setFamilyError(null);
    setFamilySaved(false);
    if (!familyName.trim()) {
      setFamilyError("Family name can't be empty.");
      return;
    }
    setSavingFamily(true);
    try {
      const { data, error: updErr } = await supabase
        .from('families')
        .update({ name: familyName.trim() })
        .eq('id', family.id)
        .select('id, name')
        .maybeSingle();
      if (updErr) throw updErr;
      if (!data) throw new Error('No row was updated — likely a permissions issue.');
      await reload();
      setFamilySaved(true);
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSavingFamily(false);
    }
  };

  // --- Reward mode ---
  const [mode, setMode] = useState<RewardMode>('hops');
  const [savingMode, setSavingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const [modeSaved, setModeSaved] = useState(false);

  useEffect(() => {
    if (family) setMode((family.reward_mode as RewardMode) ?? 'hops');
  }, [family]);

  const saveMode = async () => {
    if (!family) return;
    setModeError(null);
    setModeSaved(false);
    setSavingMode(true);
    try {
      const { data, error: updErr } = await supabase
        .from('families')
        .update({ reward_mode: mode })
        .eq('id', family.id)
        .select('id, reward_mode')
        .maybeSingle();
      if (updErr) throw updErr;
      if (!data) throw new Error('No row was updated — likely a permissions issue.');
      await reload();
      setModeSaved(true);
    } catch (err) {
      setModeError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSavingMode(false);
    }
  };

  // --- Password change ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const savePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < MIN_PASSWORD) {
      setPasswordError(`Password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updErr) throw updErr;
      setPasswordSaved(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/');
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

  const email = session?.user?.email ?? '—';

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
              Settings
            </BrandHeading>
          </View>

          {/* ACCOUNT */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.sectionHead}>
              <ThemedText
                type="smallBold"
                themeColor="accent"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Account
              </ThemedText>
              <BrandHeading level="h2" style={styles.cardTitle}>
                Your login
              </BrandHeading>
            </View>

            <View style={styles.kvRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Signed in as
              </ThemedText>
              <ThemedText type="default" style={{ marginTop: 2 }}>
                {email}
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                Email changes aren&rsquo;t supported yet — get in touch if you
                need to switch.
              </ThemedText>
            </View>

            <View style={styles.divider} />

            <ThemedText type="smallBold" themeColor="textSecondary">
              Change password
            </ThemedText>
            <TextField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              autoCapitalize="none"
              placeholder="At least 8 characters"
            />
            <TextField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              autoCapitalize="none"
              placeholder="Type it again"
            />
            {passwordError && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {passwordError}
              </ThemedText>
            )}
            {passwordSaved && !passwordError && (
              <ThemedText type="small" themeColor="accent">
                Password updated ✓
              </ThemedText>
            )}
            <View style={styles.actions}>
              <BrandButton
                label={savingPassword ? 'Saving…' : 'Save new password'}
                onPress={savePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.actions}>
              <Pressable
                onPress={onSignOut}
                style={({ pressed }) => [
                  styles.signoutBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: pressed ? theme.background : 'transparent',
                  },
                ]}
              >
                <ThemedText type="smallBold">Sign out</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* FAMILY */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.sectionHead}>
              <ThemedText
                type="smallBold"
                themeColor="accent"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Family
              </ThemedText>
              <BrandHeading level="h2" style={styles.cardTitle}>
                Family details
              </BrandHeading>
            </View>

            <TextField
              label="Family name"
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="The Bamberger family"
              autoComplete="off"
              hint="Shown at the top of your dashboard and to your kids."
            />
            {familyError && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {familyError}
              </ThemedText>
            )}
            {familySaved && !familyError && (
              <ThemedText type="small" themeColor="accent">
                Saved ✓
              </ThemedText>
            )}
            <View style={styles.actions}>
              <BrandButton
                label={savingFamily ? 'Saving…' : 'Save family name'}
                onPress={saveFamily}
                disabled={savingFamily}
              />
            </View>
          </View>

          {/* REWARDS */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.sectionHead}>
              <ThemedText
                type="smallBold"
                themeColor="accent"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Rewards
              </ThemedText>
              <BrandHeading level="h2" style={styles.cardTitle}>
                Reward mode
              </BrandHeading>
              <ThemedText type="small" themeColor="textMuted">
                How each completed chore celebrates with your kid.
              </ThemedText>
            </View>

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

            {modeError && (
              <ThemedText type="small" style={{ color: '#B23A48' }}>
                {modeError}
              </ThemedText>
            )}
            {modeSaved && !modeError && (
              <ThemedText type="small" themeColor="accent">
                Saved ✓
              </ThemedText>
            )}
            <View style={styles.actions}>
              <BrandButton
                label={savingMode ? 'Saving…' : 'Save reward mode'}
                onPress={saveMode}
                disabled={savingMode}
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
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.three,
  },
  sectionHead: { gap: 2, marginBottom: Spacing.one },
  cardTitle: { marginTop: 4 },
  kvRow: { gap: 2 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: Spacing.two,
  },
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
  signoutBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
