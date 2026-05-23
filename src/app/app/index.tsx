import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton } from '@/components/brand-button';
import { BrandHeading } from '@/components/brand-heading';
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
import { useFamily } from '@/lib/use-family';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { family, parent, kids, loading, error, addKid } = useFamily(!!session);

  const [newKidName, setNewKidName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const onAddKid = async () => {
    setAddError(null);
    if (!newKidName.trim()) {
      setAddError('Give your kid a name to show in the app.');
      return;
    }
    setAdding(true);
    try {
      await addKid(newKidName);
      setNewKidName('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add kid.');
    } finally {
      setAdding(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.background }]}
      >
        <ThemedText type="default" themeColor="textSecondary">
          Loading your family…
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
            <BrandHeading level="h3" style={styles.wordmark}>
              Home Hero
            </BrandHeading>
            <BrandButton variant="ghost" label="Sign out" onPress={onSignOut} />
          </View>

          <View style={styles.header}>
            <BrandHeading level="eyebrow" themeColor="accent">
              {family?.name ?? 'Your family'}
            </BrandHeading>
            <BrandHeading level="h1" style={styles.title}>
              Welcome back, {parent?.display_name ?? 'parent'}.
            </BrandHeading>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.lead}
            >
              This is your parental control surface. Add the kids in your
              household, then set up the bedroom chore. Photo submissions
              and AI feedback land next.
            </ThemedText>
          </View>

          {error && (
            <ThemedText type="small" style={{ color: '#B23A48' }}>
              {error}
            </ThemedText>
          )}

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Kids in {family?.name ?? 'your family'}
            </BrandHeading>
            {kids.length === 0 ? (
              <ThemedText type="default" themeColor="textSecondary">
                No kids added yet. Add the first one below.
              </ThemedText>
            ) : (
              <View style={styles.kidsList}>
                {kids.map((kid) => (
                  <View
                    key={kid.id}
                    style={[
                      styles.kidRow,
                      { borderColor: theme.border, backgroundColor: theme.background },
                    ]}
                  >
                    <ThemedText type="default">{kid.display_name}</ThemedText>
                    <ThemedText type="small" themeColor="textMuted">
                      added{' '}
                      {new Date(kid.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.addRow}>
              <TextField
                label="Add a kid"
                value={newKidName}
                onChangeText={setNewKidName}
                placeholder="e.g. Theo"
                autoComplete="off"
                autoCorrect={false}
                error={addError ?? undefined}
                style={{ minWidth: 220 }}
              />
              <View style={styles.addCta}>
                <BrandButton
                  label={adding ? 'Adding…' : 'Add kid'}
                  onPress={onAddKid}
                  disabled={adding}
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.border,
              },
            ]}
          >
            <BrandHeading level="h2" style={styles.cardTitle}>
              Bedroom chore
            </BrandHeading>
            <ThemedText type="default" themeColor="text">
              Coming next session: upload the reference photo for each kid&rsquo;s
              clean bedroom and start receiving AI-validated submissions.
            </ThemedText>
          </View>
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
  wordmark: { letterSpacing: 0.5 },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    maxWidth: ReadableContentWidth + Spacing.eight,
  },
  title: { marginTop: Spacing.one },
  lead: { maxWidth: ReadableContentWidth, fontSize: 17, lineHeight: 28 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.six,
    gap: Spacing.four,
  },
  cardTitle: { marginBottom: Spacing.one },
  kidsList: { gap: Spacing.two },
  kidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  addCta: { paddingBottom: Spacing.half },
});
