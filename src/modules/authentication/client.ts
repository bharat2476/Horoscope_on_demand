import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readSupabasePublicConfig } from '@/modules/authentication/config';

let cached: SupabaseClient | null = null;

/**
 * Sessions are not persisted. Wire secure storage before enabling sign-in.
 * Returns null when the public Supabase values are missing, so the app still opens.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = readSupabasePublicConfig();
  if (!config) {
    return null;
  }

  if (!cached) {
    cached = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return cached;
}
