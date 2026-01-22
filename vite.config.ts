
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore process is a node global available in the build script
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Define on process.env to satisfy strict Gemini SDK requirements and project logic
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || "https://mcfudvdwuvldkegwgtiz.supabase.co"),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || "sb_publishable_7oLgId9S_lriwXxrETiHuQ_WbecTVK5"),
      'process.env.SENDGRID_API_KEY': JSON.stringify(env.SENDGRID_API_KEY || ""),
      // Maintain import.meta.env for standard Vite compatibility
      'import.meta.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || "https://mcfudvdwuvldkegwgtiz.supabase.co"),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || "sb_publishable_7oLgId9S_lriwXxrETiHuQ_WbecTVK5")
    }
  };
});
