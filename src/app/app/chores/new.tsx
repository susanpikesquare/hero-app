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

  const [title, setTitle] = useState('Bedroom');
  const [kidId, setKidId] = useState<string | null>(null);
  const [isOptional, setIsOptional] = useState(false);
  const [rewardWeight, setRewardWeight] = useState(1);
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
    setSubmitting(true);
    try {
      await addChore({
        familyId: family.id,
        kidId,
        title,
        kind: title.toLowerCase().includes('bedroom') ? 'bedroom' : 'custom',
        isOptional,
        rewardWeight: isOptional ? rewardWeight : 1,
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
