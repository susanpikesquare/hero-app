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
      // Supabase project still has "Confirm email" turned ON, so we couldn't
      // mint a session. End users can't fix that — surface a friendly error
      // and log the actual cause for Susan/dev.
      // eslint-disable-next-line no-console
      console.error(
        'Signup blocked: Supabase project requires email confirmation. ' +
          'Disable Auth → Providers → Email → Confirm email.'
      );
      setSubmitting(false);
      setError(
        "Something's off on our end — we couldn't finish setting up your account. " +
          'Please email susan@pikesquare.co and we’ll sort it out fast.'
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

    // 4. Capture the device timezone so the household has a real IANA tz
    //    (engineering-defaults §1). Best-effort — the column has a UTC
    //    fallback if this fails. We don't have the family id back from
    //    the RPC, so we update by membership (the parent is now a member
    //    of exactly one family).
    try {
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data: members } = await supabase
        .from('family_members')
        .select('family_id')
        .limit(1);
      const fid = members?.[0]?.family_id;
      if (fid) {
        await supabase
          .from('families')
          .update({ timezone: tz })
          .eq('id', fid);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Could not capture family timezone:', err);
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
          Not sure yet?{' '}
          <Link href="/assessment" style={{ textDecorationLine: 'underline' }}>
            Take the 30-second self-check
          </Link>{' '}
          first.{'\n'}
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
        placeholder="from your invite email"
      />
      <TextField
        label="Family name"
        autoComplete="off"
        autoCorrect={false}
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="The Bamberger family"
        hint="What you’d like the household called inside the app."
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
          . I authorize my children’s use of the app under my supervision.
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
