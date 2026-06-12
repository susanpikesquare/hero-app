import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { type Picked as PickedPhoto, pickFromCamera, pickFromLibrary } from '@/lib/photo-pick';
import { uploadPickedPhoto } from '@/lib/upload-photo';
import { useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

export default function NewChoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { family, kids, loading: famLoading } = useFamily(!!session);
  const { addChore } = useChores(!!session);

  const [title, setTitle] = useState('');
  const [kidId, setKidId] = useState<string | null>(null);
  const [isOptional, setIsOptional] = useState(false);
  const [rewardWeight, setRewardWeight] = useState(1);
  const [recurrenceType, setRecurrenceType] = useState<
    'daily' | 'weekly' | 'none'
  >('daily');
  // ISO weekdays: 1=Mon, 2=Tue ... 7=Sun. Used when recurrence_type=weekly.
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [taskType, setTaskType] = useState<
    'photo_verification' | 'parent_verification' | 'self_attest'
  >('photo_verification');
  // Free-form tips — parent enters one per line. We split on newlines
  // before passing to addChore.
  const [tipsText, setTipsText] = useState('');
  // Reference photo (photo_verification chores only). Optional — parent
  // can leave it blank and set later. Uploaded to reference-photos bucket
  // AFTER the chore row is created, then linked back.
  const [referencePhoto, setReferencePhoto] = useState<PickedPhoto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickReferencePhoto = async (source: 'camera' | 'library') => {
    setError(null);
    const result =
      source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (result) setReferencePhoto(result);
  };

  useEffect(() => {
    if (!kidId && kids.length > 0) setKidId(kids[0].id);
  }, [kids, kidId]);

  const submit = async () => {
    setError(null);
    if (!family) return;
    if (!kidId) {
      setError('Pick which kid this chore is for.');
      return;
    }
    if (!title.trim()) {
      setError('Give the chore a title.');
      return;
    }
    if (recurrenceType === 'weekly' && recurrenceDays.length === 0) {
      setError('Pick at least one day of the week.');
      return;
    }
    setSubmitting(true);
    try {
      // 1. If a reference photo was picked, upload it FIRST so we can
      //    pass the path into the chore row at insert time. If upload
      //    fails, we still create the chore (the parent can retry the
      //    photo later from the edit screen) but surface the failure.
      let referencePhotoPath: string | null = null;
      let uploadFailedMessage: string | null = null;
      if (referencePhoto && taskType === 'photo_verification') {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        // We don't have a chore_id yet — bucket by family + kid + ts.
        // The path is stable per upload so the URL doesn't churn.
        const path = `${family.id}/${kidId}/new-${ts}-${rand}.${referencePhoto.fileExtension}`;
        const uploadResult = await uploadPickedPhoto({
          bucket: 'reference-photos',
          path,
          picked: referencePhoto,
        });
        if (uploadResult.ok) {
          referencePhotoPath = path;
        } else {
          uploadFailedMessage = `The chore was created but the reference photo didn't upload (${uploadResult.error}). Open the chore from the dashboard to try again.`;
        }
      }

      // 2. Split tips on newlines, trim, drop empties. This is the
      //    parent's "what done looks like" coaching that shows up on
      //    the kid's chore tile.
      const coachingTips = tipsText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Create the chore row with everything stitched in.
      await addChore({
        familyId: family.id,
        kidId,
        title: title.trim(),
        kind: title.toLowerCase().includes('bedroom') ? 'bedroom' : 'custom',
        isOptional,
        rewardWeight: isOptional ? rewardWeight : 1,
        recurrenceType,
        recurrenceDays: recurrenceType === 'weekly' ? recurrenceDays : [],
        taskType,
        coachingTips,
        referencePhotoPath,
      });

      if (uploadFailedMessage) {
        // Show the partial-success message rather than navigating
        // silently — parent needs to know about the missing photo.
        setError(uploadFailedMessage);
        return;
      }
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create chore.');
    } finally {
      setSubmitting(false);
    }
  };

  if (famLoading) {
    return (
      <AuthShell title="Loading…">
        <ThemedText type="default" themeColor="textSecondary">
          Just a sec.
        </ThemedText>
      </AuthShell>
    );
  }

  if (kids.length === 0) {
    return (
      <AuthShell
        eyebrow="Add a kid first"
        title="No kids yet."
        subtitle="Add a kid on the dashboard, then come back here to create their chore."
      >
        <BrandButton label="Back to dashboard" onPress={() => router.replace('/app')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="New chore"
      title="What should they tackle?"
      subtitle="For v0 we’re focused on Bedroom — tidy + bed made — but you can name this whatever fits your home."
    >
      <TextField
        label="Chore title"
        value={title}
        onChangeText={setTitle}
        placeholder="Bedroom"
        autoComplete="off"
      />

      <View style={styles.pickWrap}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Assign to
        </ThemedText>
        <View style={styles.kidGrid}>
          {kids.map((kid) => {
            const selected = kid.id === kidId;
            return (
              <Pressable
                key={kid.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setKidId(kid.id)}
                style={[
                  styles.kidChip,
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
                  {kid.display_name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.pickWrap}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Type of chore
        </ThemedText>
        <View style={styles.kidGrid}>
          <Pressable
            onPress={() => setIsOptional(false)}
            style={[
              styles.kidChip,
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
              styles.kidChip,
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
        <ThemedText type="small" themeColor="textMuted">
          {isOptional
            ? 'Extra jobs show up in a separate section for your kid. They’re opt-in and worth bonus rewards.'
            : 'Required chores show on the daily to-do list, worth 1 reward each.'}
        </ThemedText>
      </View>

      {/* Task type — PRD §18. Determines how the kid completes the chore
          AND what shows up in the parent's review queue. */}
      <View style={styles.pickWrap}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          How it gets done
        </ThemedText>
        <View style={styles.kidGrid}>
          {[
            {
              value: 'photo_verification' as const,
              label: 'Photo + AI check',
              hint:
                "Kid takes a picture; the AI gives kind, specific feedback. Best for tidy room, made bed, fed pet.",
            },
            {
              value: 'parent_verification' as const,
              label: 'Parent confirms',
              hint:
                "Kid taps Mark done; you confirm in the queue. Best for homework, practice, reading.",
            },
            {
              value: 'self_attest' as const,
              label: 'Mark done (no review)',
              hint:
                'Kid taps Mark done; it counts immediately. Best for self-care: brush teeth, shower.',
            },
          ].map((opt) => {
            const selected = opt.value === taskType;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setTaskType(opt.value)}
                style={[
                  styles.kidChip,
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

      {/* Recurrence — when this chore actually appears. Default 'daily'
          matches every existing chore in the system before this column
          existed. */}
      <View style={styles.pickWrap}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Repeats
        </ThemedText>
        <View style={styles.kidGrid}>
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
                  styles.kidChip,
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
            <View style={styles.kidGrid}>
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
                      styles.kidChip,
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

      {/* Coaching tips — what 'done' means in your home, in your words.
          Shown on the kid's chore tile so they don't have to guess. */}
      <TextField
        label="Tips for your kid (optional)"
        value={tipsText}
        onChangeText={setTipsText}
        placeholder={'e.g.\nBed is made\nNothing on the floor\nDesk wiped'}
        multiline
        numberOfLines={4}
        style={{ minHeight: 90, textAlignVertical: 'top' }}
        autoComplete="off"
        hint="One tip per line. The kid sees these on their chore tile so they know what counts as done."
      />

      {/* Reference photo — only relevant for photo-verification chores.
          Optional at create time; parent can add one later from the
          edit screen. */}
      {taskType === 'photo_verification' && (
        <View style={styles.pickWrap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Reference photo (optional)
          </ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            Show the AI what {title.trim() ? `“${title.trim()}”` : 'this chore'} looks like when it’s done at your house. Without one, the kid’s photo goes straight to your review queue.
          </ThemedText>

          {referencePhoto && (
            <View
              style={[
                styles.refPreview,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Image
                source={{ uri: referencePhoto.uri }}
                style={styles.refPreviewImg}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.refPickRow}>
            <Pressable
              onPress={() => pickReferencePhoto('camera')}
              disabled={submitting}
              style={[styles.refPickBtn, { backgroundColor: theme.accent }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                📸 Take a photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => pickReferencePhoto('library')}
              disabled={submitting}
              style={[
                styles.refPickBtn,
                { borderWidth: 1, borderColor: theme.border },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                {referencePhoto ? '🖼️ Choose a different photo' : '🖼️ Choose from photos'}
              </ThemedText>
            </Pressable>
            {referencePhoto && (
              <Pressable
                onPress={() => setReferencePhoto(null)}
                disabled={submitting}
                hitSlop={6}
              >
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={{ textDecorationLine: 'underline' }}
                >
                  Remove
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {isOptional && (
        <View style={styles.pickWrap}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Reward weight
          </ThemedText>
          <View style={styles.kidGrid}>
            {[1, 2, 3, 5].map((w) => {
              const selected = w === rewardWeight;
              return (
                <Pressable
                  key={w}
                  onPress={() => setRewardWeight(w)}
                  style={[
                    styles.kidChip,
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
          <ThemedText type="small" themeColor="textMuted">
            How much this job is worth when your kid completes it.
          </ThemedText>
        </View>
      )}

      {error && (
        <ThemedText type="small" style={{ color: '#B23A48' }}>
          {error}
        </ThemedText>
      )}

      <View style={styles.cta}>
        <BrandButton
          label={submitting ? 'Saving…' : 'Create chore'}
          onPress={submit}
          disabled={submitting}
        />
        <BrandButton variant="ghost" label="Cancel" onPress={() => router.back()} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  pickWrap: { gap: Spacing.two },
  kidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  kidChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  refPreview: {
    height: 220,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  refPreviewImg: { width: '100%', height: '100%' },
  refPickRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  refPickBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
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
