import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

/**
 * Protected layout for /app/*. Three checks before children render:
 *   1. Auth session exists (else → /login).
 *   2. The user is a member of a family (else → /signup).
 *   3. Initial bootstrap is done (spinner while we check).
 *
 * With email + password auth + immediate invite redemption inside /signup,
 * we no longer need the localStorage-pending-signup dance — by the time
 * someone lands here authenticated, the redemption has already run.
 */
export default function AppLayout() {
  const { session, loading: sessionLoading } = useAuth();
  const theme = useTheme();
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (sessionLoading) return;
      if (!session) {
        if (!cancelled) setHasFamily(false);
        return;
      }
      const { data: members } = await supabase
        .from('family_members')
        .select('id')
        .limit(1);
      if (!cancelled) setHasFamily(!!members && members.length > 0);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  if (sessionLoading || hasFamily === null) {
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
