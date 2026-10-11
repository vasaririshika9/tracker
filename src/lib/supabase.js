import { createClient } from '@supabase/supabase-js';

const clean = (val) =>
  typeof val === 'string' ? val.trim().replace(/^["']|["']$/g, '').trim() : '';

// Read public environment variables exposed by Vite
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY ||
  '';

export const supabaseUrl = clean(rawUrl);
export const supabaseAnonKey = clean(rawKey);

/**
 * Validates that the Supabase configuration is present and non-placeholder.
 */
function checkConfig(url, key) {
  if (!url || !key) return false;
  if (!/^https?:\/\/.+/i.test(url)) return false;
  if (url.includes('your-project') || url.includes('YOUR_')) return false;
  if (key.includes('your-anon-key') || key.includes('YOUR_')) return false;
  return true;
}

export const isSupabaseConfigured = checkConfig(supabaseUrl, supabaseAnonKey);

// Safe browser console status check (no secret values exposed)
if (typeof window !== 'undefined') {
  if (!isSupabaseConfigured) {
    console.warn(
      '[Paisa Auth] Supabase is not configured yet.',
      `VITE_SUPABASE_URL found: ${Boolean(supabaseUrl)}, VITE_SUPABASE_ANON_KEY found: ${Boolean(supabaseAnonKey)}.`,
      'Ensure paisa/.env is saved (Ctrl+S) and restart Vite.'
    );
  } else {
    console.info('[Paisa Auth] Supabase client initialized successfully.');
  }
}

let client = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    client = null;
  }
}

/**
 * Safe accessor for the client that throws a helpful error if accessed when unconfigured.
 */
export function getSupabase() {
  if (!client) {
    throw new Error(
      'Supabase client is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and restart Vite.'
    );
  }
  return client;
}

export const supabase = client;
export default supabase;
