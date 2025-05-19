import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tgwxhtocuvlbschnlanj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd3hodG9jdXZsYnNjaG5sYW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDg3NTcsImV4cCI6MjA2MjM4NDc1N30.aDlkYC1EkFRtw1gEjQggXqKU5p2coKuDLUhI9_hjXzI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
