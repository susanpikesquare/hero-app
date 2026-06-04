import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

/**
 * Protected layout for /app/*. Four checks before children render:
 *   1. Auth session exists (else → /login).
 *   2. The user is a member of a family (else → /signup).
 *   3. The parent has completed Step 0 / Welcome (else → /app/welcome,
 *      unless they're already there).
 *   4. Initial bootstrap is done (spinner while we check).
 *
 * With email + password auth + immediate invite redemption inside /signup,
 * we no longer need the localStorage-pending-signup dance — by the time
 * someone lands here authenticated, the redemption has already run.
 */
export default function AppLayout() {
  const { session, loading: sessionLoading } = useAuth();
  const theme = useTheme();
  const pathname = usePathname();
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [needsWelcome, setNeedsWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (sessionLoading) return;
      if (!session) {
        if (!cancelled) {
          setHasFamily(false);
          setNeedsWelcome(false);
        }
        return;
      }
      // Pull family + family_members in parallel — family_members tells us
      // if the parent is set up at all, family.parent_welcomed_at tells us
      // if they've moved past Step 0.
      const [{ data: members }, { data: family }] = await Promise.all([
        supabase.from('family_members').select('id').limit(1),
        supabase
          .from('families')
          .select('id, parent_welcomed_at')
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setHasFamily(!!members && members.length > 0);
      // Welcome is required once per family. Pre-existing families (rows
      // from before this migration) get treated as already-welcomed —
      // we don't want to surprise active users with an onboarding screen
      // they've never seen. The migration sets the column NULL, so we'd
      // need to backfill if we want the welcome to fire for them. For new
      // families it fires automatically.
      setNeedsWelcome(family ? !family.parent_welcomed_at : false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  if (sessionLoading || hasFamily === null || needsWelcome === null) {
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

  // Step 0 gate. Don't redirect if the parent is already on the welcome
  // route (otherwise the layout infinite-loops itself).
  if (needsWelcome && pathname !== '/app/welcome') {
    return <Redirect href="/app/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
