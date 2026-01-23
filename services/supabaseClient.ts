
import { createClient } from '@supabase/supabase-js';

/**
 * Access environment variables using direct dot notation.
 * This is CRITICAL for Vite's `define` plugin to perform literal string replacement.
 */
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  "https://mcfudvdwuvldkegwgtiz.supabase.co";

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  "sb_publishable_7oLgId9S_lriwXxrETiHuQ_WbecTVK5";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials could not be resolved.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
