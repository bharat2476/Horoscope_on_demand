export type CacheEntry<T> = {
  value: T;
  savedAt: string;
};

const memory = new Map<string, CacheEntry<unknown>>();

export function resetContentCache(): void {
  memory.clear();
}

export function readContentCache<T>(key: string): CacheEntry<T> | null {
  const entry = memory.get(key);
  return entry ? { value: entry.value as T, savedAt: entry.savedAt } : null;
}

export function writeContentCache<T>(key: string, value: T, savedAt: string): void {
  memory.set(key, { value, savedAt });
}

export type FetchOutcome<T> =
  { status: 'ready'; value: T } | { status: 'empty' } | { status: 'error' };

export type CachedResult<T> =
  | { status: 'ready'; value: T; cached: false }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'cached'; value: T; savedAt: string };

/**
 * A successful empty response drops the previous copy.
 * A failed request keeps the last successful copy.
 */
export function applyFetch<T>(
  key: string,
  outcome: FetchOutcome<T>,
  savedAt: string,
): CachedResult<T> {
  if (outcome.status === 'ready') {
    writeContentCache(key, outcome.value, savedAt);
    return { status: 'ready', value: outcome.value, cached: false };
  }
  if (outcome.status === 'empty') {
    memory.delete(key);
    return { status: 'empty' };
  }
  const cached = readContentCache<T>(key);
  if (cached) {
    return { status: 'cached', value: cached.value, savedAt: cached.savedAt };
  }
  return { status: 'error' };
}
