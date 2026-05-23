/**
 * Layout for the kid app surface (/kid/*).
 *
 * Gate logic:
 *   - status=loading      → spinner
 *   - status=no_session   → /kid/join (they'll start an anon session there)
 *   - status=unlinked     → /kid/join (anon session exists but isn't tied to a family_member)
 *   - status=ready        → render children
 *
 * The /kid/join page itself uses a different layout (it can be reached
 * without auth), so we let it render even when state isn't "ready" by
 * checking the route inside this gate.
 */

import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useKidSession } from '@/lib/kid-session';

export default function KidLayout() {
  const theme = useTheme();
  const { state } = useKidSession();
  const pathname = usePathname();

  const isJoinRoute = pathname === '/kid/join';

  if (state.status === 'loading') {
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

  // Allow the join page to render even without a valid kid session.
  if (isJoinRoute) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  if (state.status === 'no_session' || state.status === 'unlinked') {
    return <Redirect href="/kid/join" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
