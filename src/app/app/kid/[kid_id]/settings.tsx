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
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
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
import {
  MODE_LABELS,
  resolveKidMode,
  type KidModeSetting,
} from '@/lib/kid-mode';
import {
  PROFILE_OPTIONS,
  type SupportProfile,
} from '@/lib/neurodivergence-context';
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
  const [kidMode, setKidMode] = useState<KidModeSetting>('auto');
  const [supportProfiles, setSupportProfiles] = useState<SupportProfile[]>([]);
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

  // Share or copy the join code. On the native app the OS share sheet is
  // the right move — the parent wants to TEXT the code to their kid, not
  // just copy it. On web (no Share sheet) we fall back to clipboard.
  // The old version called navigator.clipboard unconditionally, which is
  // undefined on iOS, so "Copy code" silently did nothing on the phone
  // (Susan QA, 2026-06-12).
  const shareOrCopyCode = async () => {
    if (!generatedCode || !kid) return;
    const message =
      `${kid.display_name}'s Home Hero join code: ${generatedCode}\n\n` +
      `Open Home Hero on your device, tap "I'm a kid", and enter this code. ` +
      `It expires in 24 hours.`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(generatedCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return;
      }
      await Share.share({ message });
    } catch {
      // User dismissed the share sheet, or clipboard unavailable — no-op.
    }
  };

  useEffect(() => {
    if (!kid) return;
    setName(kid.display_name);
    setAge(kid.age != null ? String(kid.age) : '');
    setKidMode((kid.kid_mode ?? 'auto') as KidModeSetting);
    setSupportProfiles((kid.support_profiles ?? []) as SupportProfile[]);
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
        .update({
          display_name: trimmedName,
          age: nextAge,
          kid_mode: kidMode,
          support_profiles: supportProfiles,
        })
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
      // 1. Cascade-delete the kid's Storage photos BEFORE the DB delete.
      //    The DB cascade (family_members → chores → submissions FK)
      //    won't touch storage.objects — Supabase blocks direct DELETE
      //    on that table via protect_delete(). The Storage API is the
      //    correct path (engineering-defaults §8).
      //
      //    We do this defensively: read all the photo paths first, then
      //    issue parallel storage.remove() calls. Failures are logged
      //    but don't block the DB delete — orphaned photos are better
      //    than a stranded kid record.
      const [{ data: kidChores }, { data: kidSubmissions }] = await Promise.all(
        [
          supabase
            .from('chores')
            .select('id, reference_photo_path')
            .eq('kid_id', kid.id),
          supabase
            .from('submissions')
            .select('photo_path')
            .in(
              'chore_id',
              (
                await supabase
                  .from('chores')
                  .select('id')
                  .eq('kid_id', kid.id)
              ).data?.map((c) => c.id) ?? []
            ),
        ]
      );

      const referencePaths = (kidChores ?? [])
        .map((c) => c.reference_photo_path)
        .filter((p): p is string => !!p);
      const submissionPaths = (kidSubmissions ?? [])
        .map((s) => s.photo_path)
        .filter((p): p is string => !!p);

      const storageOps: Promise<unknown>[] = [];
      if (referencePaths.length > 0) {
        storageOps.push(
          supabase.storage.from('reference-photos').remove(referencePaths)
        );
      }
      if (submissionPaths.length > 0) {
        storageOps.push(
          supabase.storage.from('submissions').remove(submissionPaths)
        );
      }
      const storageResults = await Promise.allSettled(storageOps);
      for (const r of storageResults) {
        if (r.status === 'rejected') {
          console.warn(
            'Storage cleanup partial failure (DB delete will proceed):',
            r.reason
          );
        }
      }

      // 2. DB delete. Cascades chores + submissions via existing FK.
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

          {/* Optional support-profile multi-select. Parent-facing only —
              never appears on the kid surface. Seeds support defaults and
              surfaces relevant coaching to the parent. Susan's QA feedback
              (June 4): the prior "neurodivergent / neurotypical" framing
              felt clinical and intimidating. Friendlier wording + specific
              options + multi-select. */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Do any of these apply to {kid.display_name}?
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              Optional. Pick all that apply. We use what you tell us to
              tune the suggestions and the coaching just for you. Nothing
              about this ever shows up on {kid.display_name}'s side of the
              app — no label, no badge, no mention.
            </ThemedText>

            <View style={styles.modeOptions}>
              {PROFILE_OPTIONS.map((opt) => {
                const isActive = supportProfiles.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() =>
                      setSupportProfiles((prev) =>
                        prev.includes(opt.value)
                          ? prev.filter((p) => p !== opt.value)
                          : [...prev, opt.value]
                      )
                    }
                    style={({ pressed }) => [
                      styles.modeOption,
                      {
                        borderColor: isActive ? theme.accent : theme.border,
                        backgroundColor: isActive
                          ? theme.accentSoft
                          : pressed
                            ? theme.backgroundSelected
                            : theme.background,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionHeader}>
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
                        <ThemedText
                          type="smallBold"
                          style={{ color: theme.accent }}
                        >
                          ✓
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText type="default" themeColor="textSecondary">
                      {opt.hint}
                    </ThemedText>
                    {opt.sources.length > 0 && (
                      <ThemedText
                        type="small"
                        themeColor="textMuted"
                        style={{ marginTop: Spacing.one }}
                      >
                        Drawn from: {opt.sources.join(' · ')}
                      </ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {supportProfiles.length === 0 && (
              <ThemedText type="small" themeColor="textMuted">
                Nothing selected → we'll use age-typical defaults. You can
                always come back here.
              </ThemedText>
            )}
          </View>

          {/* Per-kid display mode. One Home Hero account holds kids at very
              different developmental stages — the parent surface stays
              constant for all of them, but each kid's surface speaks to
              their own age. `auto` is the right default; the manual modes
              are here for kids who are developmentally ahead or behind their
              birthday (Erica's "developmental difference, not
              birthday-determinism" framing). */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              How {kid.display_name} sees the app
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              The kid surface adapts to age: a 9-year-old sees the hero
              voice, a 14-year-old sees the teen voice, a 17-year-old sees
              the peer voice. Override here if {kid.display_name} is
              developmentally ahead or behind their birthday.
            </ThemedText>

            <View style={styles.modeOptions}>
              {(Object.keys(MODE_LABELS) as KidModeSetting[]).map((m) => {
                const isActive = kidMode === m;
                const labelInfo = MODE_LABELS[m];
                return (
                  <Pressable
                    key={m}
                    onPress={() => setKidMode(m)}
                    style={({ pressed }) => [
                      styles.modeOption,
                      {
                        borderColor: isActive ? theme.accent : theme.border,
                        backgroundColor: isActive
                          ? theme.accentSoft
                          : pressed
                            ? theme.backgroundSelected
                            : theme.background,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionHeader}>
                      <ThemedText
                        type="smallBold"
                        style={{
                          color: isActive ? theme.accent : theme.text,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        {labelInfo.label}
                      </ThemedText>
                      {isActive && (
                        <ThemedText
                          type="smallBold"
                          style={{ color: theme.accent }}
                        >
                          ✓ Selected
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText type="default" themeColor="textSecondary">
                      {labelInfo.hint}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText type="small" themeColor="textMuted">
              Right now {kid.display_name} sees the{' '}
              <ThemedText type="smallBold" themeColor="accent">
                {resolveKidMode({ setting: kidMode, age: kid.age })}
              </ThemedText>{' '}
              surface.
            </ThemedText>
          </View>

          {/* Developmental frame — re-read anytime, especially helpful when
              the parent feels frustrated and needs to recalibrate against
              what's actually typical at this age. */}
          <AgeGuidanceCard
            age={kid.age}
            kidName={kid.display_name}
            profiles={(kid.support_profiles ?? []) as SupportProfile[]}
          />

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
                    label={
                      Platform.OS === 'web'
                        ? copied
                          ? '✓ Copied'
                          : 'Copy code'
                        : 'Share code'
                    }
                    onPress={shareOrCopyCode}
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
  modeOptions: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  modeOption: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
