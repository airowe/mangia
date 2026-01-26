/**
 * Supabase Client (Legacy)
 *
 * @deprecated The app has been migrated to use Clerk + API architecture.
 * This file is kept for reference but is no longer used.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Only create client if env vars are present (prevents crash during migration)
let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
} else {
  console.warn('[Supabase] Not configured - app uses Clerk + API instead');
}

export { supabase };
