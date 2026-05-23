/**
 * Kid-side join flow. First-time setup on the kid's device.
 *
 * Flow:
 *   1. Kid enters the join code their parent gave them
 *   2. App starts an anonymous Supabase session if not already there
 *   3. App calls kid_link_with_join_code(code) — links the anon user to
 *      the family_member, clears the code so it can't be reused
 *   4. Redirect to /kid (the kid home)
 *
 * Cosmetic: kid-shell-shaped (bunny mascot, rounded font) so the kid
 * feels at home before they're even logged in.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { KidShell, KidStyles } from '@/components/kid-shell';
import { TextField } from '@/components/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  clearKidSession,
  ensureAnonymousSession,
  useKidSession,
} from '@/lib/kid-session';
import { supabase } from '@/lib/supabase';

export default function KidJoinScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state, reload } = useKidSession();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Friendly message for kids: explain in their voice what to do.
  const alreadyLinked = state.status === 'ready';

  const submit = async () => {
    setError(null);
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError('Type in the code your grown-up gave you.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Ensure we have an authenticated user (anonymous is fine).
      await ensureAnonymousSession();

      // 2. Link it to the family member.
      const { data, error: rpcErr } = await supabase.rpc(
        'kid_link_with_join_code',
        { p_code: cleaned }
      );
      if (rpcErr) {
        // Surface the most actionable error message.
        const msg = rpcErr.message.toLowerCase();
        if (msg.includes('invalid_join_code')) {
          throw new Error("That code doesn't look right. Double-check it with your grown-up.");
        }
        if (msg.includes('join_code_expired')) {
          throw new Error('That code has expired. Ask your grown-up to make a new one.');
        }
        if (msg.includes('auth_user_already_linked')) {
          throw new Error(
            'This device is already signed in as someone else. Tap "Start fresh" below first.'
          );
        }
        throw rpcErr;
      }

      // 3. Pull the new state and route to the kid home.
      await reload();
      router.replace('/kid');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startFresh = async () => {
    setError(null);
    try {
      await clearKidSession();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset.');
    }
  };

  return (
    <KidShell back={{ href: '/', label: 'Back to home' }}>
      <View style={styles.greeting}>
        <Text style={[KidStyles.greetingEyebrow, { color: theme.accent }]}>
          Welcome 👋
        </Text>
        <Text style={[KidStyles.greetingTitle, { color: theme.text }]}>
          {alreadyLinked
            ? "You're already signed in!"
            : "Let's get you set up."}
        </Text>
        <Text style={[KidStyles.greetingSub, { color: theme.textSecondary }]}>
          {alreadyLinked
            ? "Tap the button below to head to your chores."
            : "Your grown-up made a code for you. Type it in below — it has 5 letters, a dash, and 5 more letters."}
        </Text>
      </View>

      {!alreadyLinked && (
        <View
          style={[
            KidStyles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <TextField
            label="Your join code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect={false}
            placeholder="ABCDE-FGHJK"
            style={styles.codeInput}
          />

          {error && (
            <Text style={[KidStyles.choreBody, { color: '#B23A48' }]}>
              {error}
            </Text>
          )}

          <View
            style={[
              KidStyles.bigButton,
              {
                backgroundColor: submitting ? theme.textMuted : theme.accent,
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.four,
              },
            ]}
          >
            <Text
              onPress={submitting ? undefined : submit}
              style={[KidStyles.bigButtonLabel, { color: theme.background }]}
            >
              {submitting ? 'One sec…' : "Let's go!"}
            </Text>
          </View>
        </View>
      )}

      {alreadyLinked ? (
        <View
          style={[
            KidStyles.bigButton,
            {
              backgroundColor: theme.accent,
              alignSelf: 'flex-start',
              paddingHorizontal: Spacing.four,
            },
          ]}
        >
          <Text
            onPress={() => router.replace('/kid')}
            style={[KidStyles.bigButtonLabel, { color: theme.background }]}
          >
            → To my chores
          </Text>
        </View>
      ) : null}

      {state.status === 'unlinked' && (
        <View style={styles.startFreshRow}>
          <Text style={[KidStyles.choreBody, { color: theme.textMuted }]}>
            Used a code on this device before but it&rsquo;s not working?
          </Text>
          <Text
            onPress={startFresh}
            style={[
              KidStyles.choreBody,
              {
                color: theme.info,
                textDecorationLine: 'underline',
                fontWeight: '700',
              },
            ]}
          >
            Start fresh →
          </Text>
        </View>
      )}
    </KidShell>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: Spacing.three },
  codeInput: {
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  startFreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
});
