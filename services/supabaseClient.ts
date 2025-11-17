import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

let supabaseInstance: any = null;

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Anon Key must be provided.");
  }
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error("CRITICAL: Failed to initialize Supabase client.", error);
  // Export null on failure so the app can handle it gracefully instead of crashing.
}

export const supabase = supabaseInstance;