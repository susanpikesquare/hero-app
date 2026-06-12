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

  // ─── Reference photo gallery state. ─────────────────────────────
  // existingPhotos: photos already saved on the chore (with signed URLs).
  // picks: new photos chosen this session, not yet uploaded.
  const [existingPhotos, setExistingPhotos] = useState<
    { path: string; url: string | null }[]
  >([]);
  const [picks, setPicks] = useState<Picked[]>([]);
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

  // Load signed URLs for all existing reference photos (the gallery).
  // Falls back to the single reference_photo_path for chores created
  // before the array column existed (the migration backfills, so this
  // is belt-and-suspenders).
  const existingPathsKey = (
    chore?.reference_photo_paths && chore.reference_photo_paths.length > 0
      ? chore.reference_photo_paths
      : chore?.reference_photo_path
        ? [chore.reference_photo_path]
        : []
  ).join('|');
  useEffect(() => {
    let cancelled = false;
    const paths = existingPathsKey ? existingPathsKey.split('|') : [];
    if (paths.length === 0) {
      setExistingPhotos([]);
      return;
    }
    (async () => {
      const { data } = await supabase.storage
        .from('reference-photos')
        .createSignedUrls(paths, 60 * 10);
      if (cancelled) return;
      const urlByPath = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl);
      }
      setExistingPhotos(paths.map((p) => ({ path: p, url: urlByPath.get(p) ?? null })));
    })();
    return () => {
      cancelled = true;
    };
  }, [existingPathsKey]);

  const handlePick = async (source: 'camera' | 'library') => {
    setError(null);
    const result = source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setPicks((prev) => [...prev, result]);
  };

  const removeExisting = (path: string) =>
    setExistingPhotos((prev) => prev.filter((p) => p.path !== path));
  const removePick = (uri: string) =>
    setPicks((prev) => prev.filter((p) => p.uri !== uri));

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
      // 1. Build the final reference-photo gallery.
      //    - Non-photo task types clear the gallery entirely.
      //    - Otherwise: keep the existing photos the parent didn't remove,
      //      then upload any new picks and append them. We upload BEFORE
      //      the row update so a partial failure leaves orphan files rather
      //      than stale paths on the row.
      let finalPaths: string[] = [];
      if (taskType === 'photo_verification') {
        finalPaths = existingPhotos.map((p) => p.path);
        for (const pick of picks) {
          const ts = Date.now();
          const rand = Math.random().toString(36).slice(2, 8);
          const path = `${family.id}/${chore.id}/${ts}-${rand}.${pick.fileExtension}`;
          const uploadResult = await uploadPickedPhoto({
            bucket: 'reference-photos',
            path,
            picked: pick,
          });
          if (!uploadResult.ok) throw new Error(uploadResult.error);
          finalPaths.push(path);
        }
      }

      // 2. Tips split.
      const coachingTips = tipsText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Single UPDATE with everything that changed. The primary
      //    reference_photo_path (what the AI compares against) is kept in
      //    sync as the first gallery photo.
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
        reference_photo_path: finalPaths[0] ?? null,
        reference_photo_paths: finalPaths,
      };

      const { error: updErr } = await supabase
        .from('chores')
        .update(updatePayload)
        .eq('id', chore.id);
      if (updErr) throw updErr;

      setPicks([]);
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
                Reference photos
              </BrandHeading>
              <ThemedText type="default" themeColor="textSecondary">
                Show the AI — and {assignedKid?.display_name ?? 'your kid'} — what {title.trim() ? `“${title.trim()}”` : 'this chore'} looks like when it’s done at your house. You can add several (e.g. different angles). The first one is what the AI compares against.
              </ThemedText>

              {/* Gallery grid: existing saved photos + new picks, each
                  removable. Tap any thumbnail to open the zoomable viewer. */}
              {(existingPhotos.length > 0 || picks.length > 0) && (
                <View style={styles.galleryGrid}>
                  {existingPhotos.map((p, i) => (
                    <View key={`ex-${p.path}`} style={styles.galleryItem}>
                      <Pressable onPress={() => setViewerOpen(true)}>
                        {p.url ? (
                          <Image source={{ uri: p.url }} style={styles.galleryImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.galleryImg, styles.galleryPlaceholder, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <ThemedText type="small" themeColor="textMuted">…</ThemedText>
                          </View>
                        )}
                      </Pressable>
                      {i === 0 && (
                        <View style={[styles.primaryBadge, { backgroundColor: theme.accent }]}>
                          <ThemedText type="small" style={{ color: theme.background, fontSize: 10 }}>
                            AI
                          </ThemedText>
                        </View>
                      )}
                      <Pressable
                        onPress={() => removeExisting(p.path)}
                        disabled={saving}
                        style={[styles.removePhotoBtn, { backgroundColor: '#B23A48' }]}
                        hitSlop={6}
                        accessibilityLabel="Remove photo"
                      >
                        <ThemedText type="small" style={{ color: 'white', fontSize: 14 }}>×</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                  {picks.map((pick) => (
                    <View key={`new-${pick.uri}`} style={styles.galleryItem}>
                      <Image source={{ uri: pick.uri }} style={styles.galleryImg} resizeMode="cover" />
                      <View style={[styles.newBadge, { backgroundColor: theme.info }]}>
                        <ThemedText type="small" style={{ color: theme.background, fontSize: 10 }}>
                          NEW
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => removePick(pick.uri)}
                        disabled={saving}
                        style={[styles.removePhotoBtn, { backgroundColor: '#B23A48' }]}
                        hitSlop={6}
                        accessibilityLabel="Remove new photo"
                      >
                        <ThemedText type="small" style={{ color: 'white', fontSize: 14 }}>×</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.pickRow}>
                {Platform.OS !== 'web' && (
                  <Pressable
                    onPress={() => handlePick('camera')}
                    disabled={saving}
                    style={[styles.pickBtn, { backgroundColor: theme.accent }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      📸 Add from camera
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
                    {Platform.OS === 'web' ? '📁 Add a photo' : 'Add from photos'}
                  </ThemedText>
                </Pressable>
              </View>
              {picks.length > 0 && (
                <ThemedText type="small" themeColor="textMuted">
                  {picks.length} new photo{picks.length === 1 ? '' : 's'} will upload when you hit Save changes below.
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
        uris={[
          ...existingPhotos.map((p) => p.url),
          ...picks.map((pick) => pick.uri),
        ]}
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
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  galleryItem: {
    width: 110,
    height: 110,
  },
  galleryImg: {
    width: 110,
    height: 110,
    borderRadius: Radius.md,
  },
  galleryPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  newBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
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
