import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KidShell, KidStyles } from '@/components/kid-shell';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { choresForKid, submissionsForChore, useChores } from '@/lib/use-chores';
import { useFamily } from '@/lib/use-family';

export default function KidHomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ kid_id: string }>();
  const kidId = params.kid_id;

  const { kids, loading: famLoading } = useFamily(!!session);
  const { chores, submissions, loading: choresLoading } = useChores(!!session);

  if (famLoading || choresLoading) {
    return (
      <KidShell>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          One sec…
        </Text>
      </KidShell>
    );
  }

  const kid = kids.find((k) => k.id === kidId);
  if (!kid) {
    return (
      <KidShell>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Hmm — we couldn&rsquo;t find you.
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Ask a grown-up to hand you the device again.
        </Text>
      </KidShell>
    );
  }

  const kidChores = choresForKid(chores, kidId);

  return (
    <KidShell>
      <View style={styles.greeting}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          Hi {kid.display_name} 👋
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          Ready to hop on a chore?
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          Tap a chore, take a photo when you&rsquo;re done, and your grown-up
          gets a heads-up.
        </Text>
      </View>

      {kidChores.length === 0 ? (
        <View
          style={[
            KidStyles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <Text style={[KidStyles.choreTitle, { color: theme.text }]}>
            No chores yet.
          </Text>
          <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
            A grown-up needs to set one up for you. Check back in a sec!
          </Text>
        </View>
      ) : (
        <View style={{ gap: Spacing.three }}>
          {kidChores.map((chore) => {
            const subs = submissionsForChore(submissions, chore.id);
            const last = subs[0];
            return (
              <Link
                key={chore.id}
                href={`/app/kid/${kidId}/submit/${chore.id}`}
                asChild
              >
                <Pressable
                  style={({ pressed }) => [
                    KidStyles.card,
                    {
                      backgroundColor: pressed ? theme.accentSoft : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[KidStyles.choreTitle, { color: theme.text }]}>
                    {chore.title}
                  </Text>
                  <Text style={[KidStyles.choreBody, { color: theme.textSecondary }]}>
                    {last
                      ? `Last hop: ${new Date(last.submitted_at).toLocaleString(undefined, {
                          weekday: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}`
                      : 'No hops yet — ready when you are.'}
                  </Text>
                  <View
                    style={[
                      KidStyles.bigButton,
                      { backgroundColor: theme.accent, alignSelf: 'flex-start', paddingHorizontal: Spacing.four },
                    ]}
                  >
                    <Text
                      style={[KidStyles.bigButtonLabel, { color: theme.background }]}
                    >
                      📸 Take a photo
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
    </KidShell>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: Spacing.three },
});
