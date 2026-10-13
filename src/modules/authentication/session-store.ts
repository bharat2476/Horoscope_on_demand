import type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Session tokens stay in process memory.
 * AsyncStorage is intentionally not used. Encrypted disk storage is not wired yet.
 */
export function createMemorySessionStore(): SupportedStorage {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return Promise.resolve(values.get(key) ?? null);
    },
    setItem(key, value) {
      values.set(key, value);
      return Promise.resolve();
    },
    removeItem(key) {
      values.delete(key);
      return Promise.resolve();
    },
  };
}

export const memorySessionStore = createMemorySessionStore();
