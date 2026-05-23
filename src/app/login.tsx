import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInErr) {
      setSubmitting(false);
      setError(
        signInErr.message === 'Invalid login credentials'
          ? "That email and password don't match — try again."
          : signInErr.message
      );
      return;
    }

    router.replace('/app');
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Home Hero."
      subtitle="Enter the email and password you set up when you created your family."
      footer={
        <ThemedText type="small" themeColor="textMuted">
          Don’t have an account yet?{' '}
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
      <TextField
        label="Password"
        autoComplete="current-password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
      />

      {error && (
        <ThemedText type="small" style={{ color: '#B23A48' }}>
          {error}
        </ThemedText>
      )}

      <View style={styles.cta}>
        <BrandButton
          label={submitting ? 'Signing in…' : 'Sign in'}
          onPress={submit}
          disabled={submitting}
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
