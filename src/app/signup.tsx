import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const PENDING_SIGNUP_KEY = 'homehero:pending-signup';

type PendingSignup = {
  inviteCode: string;
  familyName: string;
  displayName: string;
  email: string;
};

function stashPendingSignup(data: PendingSignup) {
  if (Platform.OS !== 'web') return;
  try {
    window.localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getRedirectUrl() {
  if (Platform.OS !== 'web') return undefined;
  return `${window.location.origin}/app`;
}

export default function SignupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (!inviteCode.trim() || !familyName.trim() || !displayName.trim() || !email.trim()) {
      setError('All fields are required.');
      return;
    }

    setStatus('submitting');

    // 1. Pre-validate the invite code so we don't waste a magic-link email
    //    on a bad code.
    const { data: codeOk, error: peekErr } = await supabase.rpc('peek_invite_code', {
      p_code: inviteCode.trim(),
    });
    if (peekErr) {
      setStatus('idle');
      setError(peekErr.message);
      return;
    }
    if (!codeOk) {
      setStatus('idle');
      setError("That invite code isn't valid or has already been used.");
      return;
    }

    // 2. Stash the form so we can redeem after the magic link returns.
    stashPendingSignup({
      inviteCode: inviteCode.trim(),
      familyName: familyName.trim(),
      displayName: displayName.trim(),
      email: email.trim(),
    });

    // 3. Send the magic link.
    const redirect = getRedirectUrl();
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: redirect ? { emailRedirectTo: redirect } : undefined,
    });

    if (otpErr) {
      setStatus('idle');
      setError(otpErr.message);
      return;
    }

    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="We just sent you a magic link."
        subtitle={`Open the email at ${email} and click the link. It signs you in and finishes setting up your family.`}
        footer={
          <ThemedText type="small" themeColor="textMuted">
            Wrong email?{' '}
            <Link href="/signup" style={{ textDecorationLine: 'underline' }}>
              Start over
            </Link>
            .
          </ThemedText>
        }
      >
        <ThemedText type="small" themeColor="textSecondary">
          The link expires in about an hour. You can close this tab — we&rsquo;ll
          take it from there.
        </ThemedText>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Founding family · invite-only"
      title="Set up your Home Hero family."
      subtitle="Use the invite code Erica sent you. We&rsquo;ll email you a one-tap sign-in link."
      footer={
        <ThemedText type="small" themeColor="textMuted">
          Already have an account?{' '}
          <Link href="/login" style={{ textDecorationLine: 'underline' }}>
            Sign in
          </Link>
          .
        </ThemedText>
      }
    >
      <TextField
        label="Invite code"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect={false}
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="e.g. HOMEHERO-A4F3-9KX2"
      />
      <TextField
        label="Family name"
        autoComplete="off"
        autoCorrect={false}
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="The Bamberger family"
        hint="What you&rsquo;d like the household called inside the app."
      />
      <TextField
        label="Your name"
        autoComplete="name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Susan"
      />
      <TextField
        label="Email"
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />

      {error && (
        <ThemedText type="small" style={{ color: '#B23A48' }}>
          {error}
        </ThemedText>
      )}

      <View style={styles.cta}>
        <BrandButton
          label={status === 'submitting' ? 'Sending link…' : 'Send me the link'}
          onPress={submit}
          disabled={status === 'submitting'}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: Spacing.two,
    alignItems: 'flex-start',
  },
});
