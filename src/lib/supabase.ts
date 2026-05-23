/**
 * Supabase client for Home Hero.
 *
 * The publishable key below is safe to ship to the browser — row-level
 * security policies are what protect the data. If we ever need different
 * URL/keys per environment (preview vs prod), move these to
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars.
 */

// React Native's URL implementation is incomplete; supabase-js needs the
// polyfill to construct Request URLs without throwing. Must be imported
// BEFORE createClient runs. Harmless on web.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from './database.types';

const SUPABASE_URL = 'https://lgougfxihmbiezlmvbvm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_F7VU_RFG6XdofNDS54iaqg_Uoc-VSFk';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // On native, persist the session via AsyncStorage.
    // On web, supabase-js auto-detects localStorage.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

export type SupabaseClient = typeof supabase;
