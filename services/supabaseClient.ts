
import { createClient } from '@supabase/supabase-js';

// Safe accessor for environment variables to support both Vite and non-Vite environments
const getEnvVar = (key: string, fallback: string): string => {
  // Check process.env (standard for this environment)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check import.meta.env (Vite specific)
  try {
    // @ts-ignore - import.meta.env might not exist in native ESM
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors if import.meta.env is not accessible
  }

  return fallback;
};

// Updated with the user provided Supabase credentials
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', "https://mcfudvdwuvldkegwgtiz.supabase.co");
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', "sb_publishable_7oLgId9S_lriwXxrETiHuQ_WbecTVK5");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL: Supabase environment variables are missing.'
  );
}

/**
 * Singleton Supabase client.
 * Uses safe accessors to prevent runtime crashes in diverse hosting environments.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
