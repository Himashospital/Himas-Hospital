
import { createClient } from '@supabase/supabase-js';

// Safe accessor for environment variables
const getEnvVar = (key: string, fallback: string): string => {
  // Check process.env (Vite define plugin injections)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check import.meta.env (Vite native ESM)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }

  return fallback;
};

// Updated with the user provided Supabase credentials and fallbacks
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', "https://mcfudvdwuvldkegwgtiz.supabase.co");
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', "sb_publishable_7oLgId9S_lriwXxrETiHuQ_WbecTVK5");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are missing.');
}

/**
 * Singleton Supabase client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
