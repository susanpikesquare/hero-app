import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

function getRedirectUrl() {
  if (Platform.OS !== 'web') return undefined;
  return `${window.location.origin}/app`;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setStatus('submitting');

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
        title="Magic link on its way."
        subtitle={`Open the email at ${email} and click the link to sign back in.`}
      >
        <ThemedText type="small" themeColor="textSecondary">
          You can close this tab — we&rsquo;ll take it from there.
        </ThemedText>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Home Hero."
      subtitle="Enter the email you used to set up your family and we&rsquo;ll send you a one-tap sign-in link."
      footer={
        <ThemedText type="small" themeColor="textMuted">
          Don&rsquo;t have an account yet?{' '}
          <Link href="/signup" style={{ textDecorationLine: 'underline' }}>
            Set up your family
          </Link>
          .
        </ThemedText>
      }
    >
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
