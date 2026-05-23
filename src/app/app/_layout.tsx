import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

const PENDING_SIGNUP_KEY = 'homehero:pending-signup';

type PendingSignup = {
  inviteCode: string;
  familyName: string;
  displayName: string;
  email: string;
};

function readPendingSignup(): PendingSignup | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

function clearPendingSignup() {
  if (Platform.OS !== 'web') return;
  try {
    window.localStorage.removeItem(PENDING_SIGNUP_KEY);
  } catch {
    // ignore
  }
}

/**
 * Protected layout for /app/*. Three things have to hold before children render:
 *   1. Session exists (else → /login).
 *   2. The user is a member of a family (else we either run the pending
 *      signup redemption stashed by /signup, or redirect to /signup).
 *   3. Initial bootstrap is done (we show a spinner while figuring it out).
 */
export default function AppLayout() {
  const { session, loading: sessionLoading } = useAuth();
  const theme = useTheme();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (sessionLoading) return;
      if (!session) {
        if (!cancelled) {
          setHasFamily(false);
          setBootstrapping(false);
        }
        return;
      }

      // Check whether this auth user is already a family member.
      const { data: members } = await supabase
        .from('family_members')
        .select('id')
        .limit(1);

      if (members && members.length > 0) {
        if (!cancelled) {
          setHasFamily(true);
          setBootstrapping(false);
        }
        return;
      }

      // No family yet — try to finish a pending signup if one was stashed.
      const pending = readPendingSignup();
      if (pending) {
        const { error } = await supabase.rpc(
          'redeem_invite_and_create_family',
          {
            p_code: pending.inviteCode,
            p_family_name: pending.familyName,
            p_parent_display_name: pending.displayName,
          }
        );

        if (!error) {
          clearPendingSignup();
          if (!cancelled) {
            setHasFamily(true);
            setBootstrapping(false);
          }
          return;
        }
        // If redemption failed, fall through and send to /signup so the
        // user can re-enter their code (and see the error).
      }

      if (!cancelled) {
        setHasFamily(false);
        setBootstrapping(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  if (sessionLoading || bootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!hasFamily) {
    return <Redirect href="/signup" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
