/**
 * Chore detail / edit screen.
 *
 * Per QA review on 2026-06-05: the original version of this screen only
 * let the parent manage the reference photo, which meant any other
 * setting error (wrong title, wrong recurrence, wrong type) forced a
 * delete + recreate. This rewrite makes every field editable in place
 * and keeps the reference-photo upload flow intact.
 *
 * Save model: one "Save changes" button at the bottom commits all
 * edits in a single UPDATE. The reference photo, if a new one was
 * picked, uploads first so the new path can be written into the same
 * row update.
 */

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
import { BrandLogo } from '@/components/brand-logo';
import { PhotoViewer } from '@/components/photo-viewer';
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
import { uploadPickedPhoto } from '@/lib/upload-photo';
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

type Picked = {
  uri: string;
  mimeType: string;
  fileExtension: string;
  base64?: string;
};

// Native needs base64 from the picker to avoid the broken
// fetch(uri).blob() path on iOS. See src/lib/upload-photo.ts.
const NEEDS_BASE64 = Platform.OS !== 'web';

async function pickFromLibrary(): Promise<Picked | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    base64: NEEDS_BASE64,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileExtension: (a.fileName?.split('.').pop() ?? 'jpg').toLowerCase(),
    base64: a.base64 ?? undefined,
  };
}

async function pickFromCamera(): Promise<Picked | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.85,
    base64: NEEDS_BASE64,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: a.mimeType ?? 'image/jpeg',
    fileExtension: (a.fileName?.split('.').pop() ?? 'jpg').toLowerCase(),
    base64: a.base64 ?? undefined,
  };
}

type TaskType = 'photo_verification' | 'parent_verification' | 'self_attest';
type RecurrenceType = 'daily' | 'weekly' | 'none';

export default function ChoreDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ chore_id: string }>();
  const { session } = useAuth();
  const { family, kids } = useFamily(!!session);
  const { chores, loading: choresLoading, reload } = useChores(!!session);

  const chore = chores.find((c) => c.id === params.chore_id);
  const assignedKid = chore ? kids.find((k) => k.id === chore.kid_id) : null;

  // ─── Editable form state, hydrated from `chore` once it loads. ──
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('photo_verification');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [isOptional, setIsOptional] = useState(false);
  const [rewardWeight, setRewardWeight] = useState(1);
  const [tipsText, setTipsText] = useState('');

  // ─── Reference photo state. ─────────────────────────────────────
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // ─── Save state. ────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Hydrate the form from the loaded chore.
  useEffect(() => {
    if (!chore) return;
    setTitle(chore.title ?? '');
    setTaskType((chore.task_type as TaskType | null) ?? 'photo_verification');
    setRecurrenceType(
      (chore.recurrence_type as RecurrenceType | null) ?? 'daily'
    );
    setRecurrenceDays(chore.recurrence_days ?? []);
    setIsOptional(!!chore.is_optional);
    setRewardWeight(chore.reward_weight ?? 1);
    setTipsText((chore.coaching_tips ?? []).join('\n'));
  }, [chore]);

  // Load signed URL for any existing reference photo.
  useEffect(() => {
    let cancelled = false;
    if (!chore?.reference_photo_path) {
      setReferenceUrl(null);
      return;
    }
    supabase.storage
      .from('reference-photos')
      .createSignedUrl(chore.reference_photo_path, 60 * 10)
      .then(({ data, error: signErr }) => {
        if (cancelled) return;
        if (signErr) {
          setReferenceUrl(null);
          return;
        }
        setReferenceUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [chore?.reference_photo_path]);

  const handlePick = async (source: 'camera' | 'library') => {
    setError(null);
    const result = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setPicked(result);
  };

  const handleSave = async () => {
    setError(null);
    setSavedMessage(null);
    if (!family || !chore) return;
    if (!title.trim()) {
      setError('Give the chore a title.');
      return;
    }
    if (recurrenceType === 'weekly' && recurrenceDays.length === 0) {
      setError('Pick at least one day of the week.');
      return;
    }

    setSaving(true);
    try {
      // 1. Upload a new reference photo if one was picked. We do this
      //    BEFORE the row update so a partial failure (photo uploaded
      //    but row update failed) leaves the photo as an orphan rather
      //    than a stale path on the row.
      let nextReferencePath: string | null | undefined = undefined;
      if (picked && taskType === 'photo_verification') {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        const path = `${family.id}/${chore.id}/${ts}-${rand}.${picked.fileExtension}`;
        const uploadResult = await uploadPickedPhoto({
          bucket: 'reference-photos',
          path,
          picked,
        });
        if (!uploadResult.ok) throw new Error(uploadResult.error);
        nextReferencePath = path;
      } else if (taskType !== 'photo_verification') {
        // If the chore is no longer photo-verified, clear any stale
        // reference photo path.
        nextReferencePath = null;
      }

      // 2. Tips split.
      const coachingTips = tipsText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Single UPDATE with everything that changed.
      const verification_kind: 'photo' | 'checklist' =
        taskType === 'photo_verification' ? 'photo' : 'checklist';
      const updatePayload = {
        title: title.trim(),
        kind: title.toLowerCase().includes('bedroom') ? 'bedroom' : chore.kind ?? 'custom',
        task_type: taskType,
        verification_kind,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : [],
        is_optional: isOptional,
        reward_weight: isOptional ? rewardWeight : 1,
        coaching_tips: coachingTips,
        // Always include reference_photo_path so the column is set
        // consistently. When `nextReferencePath` is undefined (no new
        // pick, still photo_verification), keep the existing path.
        reference_photo_path:
          nextReferencePath !== undefined
            ? nextReferencePath
            : (chore.reference_photo_path ?? null),
      };

      const { error: updErr } = await supabase
        .from('chores')
        .update(updatePayload)
        .eq('id', chore.id);
      if (updErr) throw updErr;

      setPicked(null);
      await reload();
      setSavedMessage('Saved ✓');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (choresLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Loading chore…
        </ThemedText>
      </View>
    );
  }

  if (!chore) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="default" themeColor="textSecondary">
          Couldn’t find that chore.
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
              {assignedKid?.display_name ?? 'A kid'} · Edit chore
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              {chore.title}
            </BrandHeading>
            <ThemedText type="default" themeColor="textSecondary">
              Change anything that needs to change. Hit Save when you’re
              done. Deleting the chore from the dashboard wipes the row
              and its history — editing here keeps everything.
            </ThemedText>
          </View>

          {/* Title */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Basics
            </BrandHeading>
            <TextField
              label="Chore title"
              value={title}
              onChangeText={setTitle}
              placeholder="Bedroom"
              autoComplete="off"
            />

            <View style={styles.pickWrap}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Type of chore
              </ThemedText>
              <View style={styles.chipGrid}>
                <Pressable
                  onPress={() => setIsOptional(false)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !isOptional ? theme.accent : 'transparent',
                      borderColor: !isOptional ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="default"
                    style={{ color: !isOptional ? theme.background : theme.text }}
                  >
                    Required (daily)
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setIsOptional(true)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isOptional ? theme.info : 'transparent',
                      borderColor: isOptional ? theme.info : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="default"
                    style={{ color: isOptional ? theme.background : theme.text }}
                  >
                    Optional extra job
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {isOptional && (
              <View style={styles.pickWrap}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Reward weight
                </ThemedText>
                <View style={styles.chipGrid}>
                  {[1, 2, 3, 5].map((w) => {
                    const selected = w === rewardWeight;
                    return (
                      <Pressable
                        key={w}
                        onPress={() => setRewardWeight(w)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.info : 'transparent',
                            borderColor: selected ? theme.info : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          type="default"
                          style={{ color: selected ? theme.background : theme.text }}
                        >
                          +{w}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* How it gets done */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              How it gets done
            </BrandHeading>
            <View style={styles.chipGrid}>
              {[
                {
                  value: 'photo_verification' as const,
                  label: 'Photo + AI check',
                },
                {
                  value: 'parent_verification' as const,
                  label: 'Parent confirms',
                },
                {
                  value: 'self_attest' as const,
                  label: 'Mark done (no review)',
                },
              ].map((opt) => {
                const selected = opt.value === taskType;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTaskType(opt.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? theme.accent : 'transparent',
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={{ color: selected ? theme.background : theme.text }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedText type="small" themeColor="textMuted">
              {taskType === 'photo_verification'
                ? "Kid takes a picture; the AI gives kind, specific feedback. Best for tidy room, made bed, fed pet."
                : taskType === 'parent_verification'
                  ? "Kid taps Mark done; you confirm in the queue. Best for homework, practice, reading."
                  : 'Kid taps Mark done; it counts immediately. Best for self-care: brush teeth, shower.'}
            </ThemedText>
          </View>

          {/* Recurrence */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              When it shows up
            </BrandHeading>
            <View style={styles.chipGrid}>
              {[
                { value: 'daily' as const, label: 'Every day' },
                { value: 'weekly' as const, label: 'Specific days' },
                { value: 'none' as const, label: 'One time' },
              ].map((opt) => {
                const selected = opt.value === recurrenceType;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setRecurrenceType(opt.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? theme.accent : 'transparent',
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={{ color: selected ? theme.background : theme.text }}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {recurrenceType === 'weekly' && (
              <View style={{ gap: Spacing.two }}>
                <ThemedText type="small" themeColor="textMuted">
                  Tap the days this chore is due.
                </ThemedText>
                <View style={styles.chipGrid}>
                  {[
                    { value: 1, label: 'Mon' },
                    { value: 2, label: 'Tue' },
                    { value: 3, label: 'Wed' },
                    { value: 4, label: 'Thu' },
                    { value: 5, label: 'Fri' },
                    { value: 6, label: 'Sat' },
                    { value: 7, label: 'Sun' },
                  ].map((d) => {
                    const selected = recurrenceDays.includes(d.value);
                    return (
                      <Pressable
                        key={d.value}
                        onPress={() =>
                          setRecurrenceDays((prev) =>
                            prev.includes(d.value)
                              ? prev.filter((x) => x !== d.value)
                              : [...prev, d.value].sort((a, b) => a - b)
                          )
                        }
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.info : 'transparent',
                            borderColor: selected ? theme.info : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          type="default"
                          style={{ color: selected ? theme.background : theme.text }}
                        >
                          {d.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Tips */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Tips for {assignedKid?.display_name ?? 'your kid'}
            </BrandHeading>
            <TextField
              label="Tips (optional)"
              value={tipsText}
              onChangeText={setTipsText}
              placeholder={'e.g.\nBed is made\nNothing on the floor\nDesk wiped'}
              multiline
              numberOfLines={4}
              style={{ minHeight: 110, textAlignVertical: 'top' }}
              autoComplete="off"
              hint="One tip per line. Shown on the kid's chore tile so they know what 'done' looks like."
            />
          </View>

          {/* Reference photo — only relevant for photo_verification. */}
          {taskType === 'photo_verification' && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <BrandHeading level="h2" style={styles.cardTitle}>
                Reference photo
              </BrandHeading>
              <ThemedText type="default" themeColor="textSecondary">
                Show the AI what {title.trim() ? `“${title.trim()}”` : 'this chore'} looks like when it’s done at your house. {assignedKid?.display_name ?? 'Your kid'}’s submitted photos get compared against this one.
              </ThemedText>

              <Pressable
                onPress={() => {
                  if (picked || referenceUrl) setViewerOpen(true);
                }}
                style={[
                  styles.preview,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              >
                {picked ? (
                  <Image source={{ uri: picked.uri }} style={styles.previewImg} resizeMode="contain" />
                ) : referenceUrl ? (
                  <Image
                    source={{ uri: referenceUrl }}
                    style={styles.previewImg}
                    resizeMode="contain"
                  />
                ) : (
                  <ThemedText type="default" themeColor="textMuted">
                    No reference photo yet.
                  </ThemedText>
                )}
                {(picked || referenceUrl) && (
                  <View
                    style={[
                      styles.zoomHint,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <ThemedText type="small" themeColor="textSecondary">
                      Tap to enlarge
                    </ThemedText>
                  </View>
                )}
              </Pressable>

              <View style={styles.pickRow}>
                {Platform.OS !== 'web' && (
                  <Pressable
                    onPress={() => handlePick('camera')}
                    disabled={saving}
                    style={[styles.pickBtn, { backgroundColor: theme.accent }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      📸 Use camera
                    </ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handlePick('library')}
                  disabled={saving}
                  style={[
                    styles.pickBtn,
                    Platform.OS === 'web'
                      ? { backgroundColor: theme.accent }
                      : { borderWidth: 1, borderColor: theme.border },
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: Platform.OS === 'web' ? theme.background : theme.text,
                    }}
                  >
                    {Platform.OS === 'web' ? '📁 Pick a photo' : 'Pick from photos'}
                  </ThemedText>
                </Pressable>
                {picked && (
                  <Pressable onPress={() => setPicked(null)} disabled={saving} hitSlop={6}>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={{ textDecorationLine: 'underline' }}
                    >
                      Discard new photo
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              {picked && (
                <ThemedText type="small" themeColor="textMuted">
                  The new photo uploads when you hit Save changes below.
                </ThemedText>
              )}
            </View>
          )}

          {error && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {error}
            </ThemedText>
          )}
          {savedMessage && !error && (
            <ThemedText type="small" themeColor="accent">
              {savedMessage}
            </ThemedText>
          )}

          <View style={styles.cta}>
            <BrandButton
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={handleSave}
              disabled={saving}
            />
            <BrandButton
              variant="ghost"
              label="Done"
              onPress={() => router.replace('/app')}
            />
          </View>
        </View>
      </SafeAreaView>

      <PhotoViewer
        visible={viewerOpen}
        uri={picked?.uri ?? referenceUrl}
        alt="Reference photo"
        onClose={() => setViewerOpen(false)}
      />
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
    gap: Spacing.four,
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
  cardTitle: { marginBottom: Spacing.one },
  pickWrap: { gap: Spacing.two },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  preview: {
    minHeight: 280,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: Spacing.two,
  },
  previewImg: { width: '100%', height: 280 },
  zoomHint: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pickRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap', alignItems: 'center' },
  pickBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
});
