import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Client separato che punta al Supabase esterno dell'utente
const EXTERNAL_SUPABASE_URL = "https://mfzufzajsybdgdlhjkie.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1menVmemFqc3liZGdkbGhqa2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDcxNTksImV4cCI6MjA4ODM4MzE1OX0.mmkrmquEkD_kuRg03SCamjeFWxsfmWU3-Q4FIVnot1Y";

export const supabase = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
