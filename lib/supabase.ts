import { createClient } from '@supabase/supabase-js';
import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPO_PUBLIC_SUPABASE_URL = 'https://tgwxhtocuvlbschnlanj.supabase.co';
const EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd3hodG9jdXZsYnNjaG5sYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDg3NTcsImV4cCI6MjA2MjM4NDc1N30.aDlkYC1EkFRtw1gEjQggXqKU5p2coKuDLUhI9_hjXzI';

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL!,
  EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
