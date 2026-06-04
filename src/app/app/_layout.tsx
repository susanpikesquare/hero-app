import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

/**
 * Protected layout for /app/*. Five checks before children render:
 *   1. Auth session exists (else → /login).
 *   2. The user is a member of a family (else → /signup).
 *   3. The parent has completed Step 0 / Welcome (else → /app/welcome).
 *   4. The end-of-week-1 conflict check-in is due (else → /app/week-one).
 *   5. Initial bootstrap is done (spinner while we check).
 *
 * With email + password auth + immediate invite redemption inside /signup,
 * we no longer need the localStorage-pending-signup dance — by the time
 * someone lands here authenticated, the redemption has already run.
 */
const WEEK_ONE_GATE_MS = 7 * 24 * 60 * 60 * 1000;

export default function AppLayout() {
  const { session, loading: sessionLoading } = useAuth();
  const theme = useTheme();
  const pathname = usePathname();
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [needsWelcome, setNeedsWelcome] = useState<boolean | null>(null);
  const [needsWeekOne, setNeedsWeekOne] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (sessionLoading) return;
      if (!session) {
        if (!cancelled) {
          setHasFamily(false);
          setNeedsWelcome(false);
          setNeedsWeekOne(false);
        }
        return;
      }
      // Pull family + family_members in parallel — family_members tells us
      // if the parent is set up at all, family.parent_welcomed_at tells us
      // if they've moved past Step 0, and the week-1 columns tell us if
      // the conflict check-in is due.
      const [{ data: members }, { data: family }] = await Promise.all([
        supabase.from('family_members').select('id').limit(1),
        supabase
          .from('families')
          .select(
            'id, parent_welcomed_at, week_one_checkin_answered_at'
          )
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setHasFamily(!!members && members.length > 0);
      setNeedsWelcome(family ? !family.parent_welcomed_at : false);

      // Week-1 check-in gate: fire once when (a) the parent has been
      // welcomed (so they've had a real first week), (b) seven days have
      // passed since `parent_welcomed_at`, and (c) the parent hasn't
      // answered or skipped yet.
      let weekOneDue = false;
      if (
        family &&
        family.parent_welcomed_at &&
        !family.week_one_checkin_answered_at
      ) {
        const welcomedAt = new Date(family.parent_welcomed_at).getTime();
        const elapsed = Date.now() - welcomedAt;
        weekOneDue = elapsed >= WEEK_ONE_GATE_MS;
      }
      setNeedsWeekOne(weekOneDue);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  if (
    sessionLoading ||
    hasFamily === null ||
    needsWelcome === null ||
    needsWeekOne === null
  ) {
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

  // Week-1 conflict check-in gate. Same guard against self-loop.
  if (needsWeekOne && pathname !== '/app/week-one') {
    return <Redirect href="/app/week-one" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
