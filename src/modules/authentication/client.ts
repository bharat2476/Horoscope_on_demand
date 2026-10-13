import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readSupabasePublicConfig } from '@/modules/authentication/config';
import { memorySessionStore } from '@/modules/authentication/session-store';

let cached: SupabaseClient | null = null;

/**
 * The session lives in process memory for this launch. It is not written to AsyncStorage.
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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: memorySessionStore,
      },
    });
  }

  return cached;
}
