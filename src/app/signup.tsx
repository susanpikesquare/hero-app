import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { BrandButton } from '@/components/brand-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const MIN_PASSWORD = 8;

export default function SignupScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [inviteCode, setInviteCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (!inviteCode.trim() || !familyName.trim() || !displayName.trim() || !email.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (!acceptedTerms) {
      setError(
        'Please confirm you accept the Privacy Policy and Terms of Service and that you are authorizing your children’s use of the app.'
      );
      return;
    }

    setSubmitting(true);

    // 1. Pre-validate the invite code so we don't create an auth user
    //    only to discover the code is bad.
    const { data: codeOk, error: peekErr } = await supabase.rpc(
      'peek_invite_code',
      { p_code: inviteCode.trim() }
    );
    if (peekErr) {
      setSubmitting(false);
      setError(peekErr.message);
      return;
    }
    if (!codeOk) {
      setSubmitting(false);
      setError("That invite code isn't valid or has already been used.");
      return;
    }

    // 2. Create the auth user with email + password.
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpErr) {
      setSubmitting(false);
      setError(signUpErr.message);
      return;
    }
    if (!signUpData.session) {
      // Supabase still has "Confirm email" turned ON. For v0 we need it off
      // so we can run the redemption RPC inside the same session.
      setSubmitting(false);
      setError(
        'Email confirmation is still required on this Supabase project. Disable Auth → Providers → Email → Confirm email, then try again.'
      );
      return;
    }

    // 3. Redeem the invite + create the family.
    const { error: redeemErr } = await supabase.rpc(
      'redeem_invite_and_create_family',
      {
        p_code: inviteCode.trim(),
        p_family_name: familyName.trim(),
        p_parent_display_name: displayName.trim(),
      }
    );
    if (redeemErr) {
      setSubmitting(false);
      setError(redeemErr.message);
      return;
    }

    router.replace('/app');
  };

  return (
    <AuthShell
      eyebrow="Founding family · invite-only"
      title="Set up your Home Hero family."
      subtitle="Use the invite code you received. Pick a password you'll remember — that and your email are how you'll sign back in."
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
        placeholder="HOMEY"
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
      <TextField
        label="Password"
        autoComplete="new-password"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        hint="Pick something you'll remember. You can change it later."
      />

      <Pressable
        onPress={() => setAcceptedTerms((prev) => !prev)}
        style={[
          styles.consent,
          {
            backgroundColor: acceptedTerms ? theme.accentSoft : theme.background,
            borderColor: acceptedTerms ? theme.accent : theme.border,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: acceptedTerms ? theme.accent : theme.textMuted,
              backgroundColor: acceptedTerms ? theme.accent : 'transparent',
            },
          ]}
        >
          {acceptedTerms && (
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              ✓
            </ThemedText>
          )}
        </View>
        <ThemedText
          type="small"
          themeColor="text"
          style={{ flex: 1, lineHeight: 20 }}
        >
          I am 18 or older, I am the parent or legal guardian of any children
          who will use this app, and I agree to the{' '}
          <Link
            href="/privacy"
            style={{ textDecorationLine: 'underline', color: theme.info }}
          >
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link
            href="/terms"
            style={{ textDecorationLine: 'underline', color: theme.info }}
          >
            Terms of Service
          </Link>
          . I authorize my children&rsquo;s use of the app under my supervision.
        </ThemedText>
      </Pressable>

      {error && (
        <ThemedText type="small" style={{ color: '#B23A48' }}>
          {error}
        </ThemedText>
      )}

      <View style={styles.cta}>
        <BrandButton
          label={submitting ? 'Setting things up…' : 'Create my family'}
          onPress={submit}
          disabled={submitting || !acceptedTerms}
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
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
