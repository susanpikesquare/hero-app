import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
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
  cta: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
});
