import { getSupabaseClient } from '@/modules/authentication/client';
import { readSupabasePublicConfig } from '@/modules/authentication/config';

export const PUBLIC_VIEWS = [
  'rashis',
  'published_daily_rashis',
  'published_rituals',
  'published_festivals',
  'published_temples',
  'published_ritual_editions',
  'published_festival_editions',
  'published_temple_editions',
  'published_content_editions',
  'panchang_cache_public',
] as const;

export type PublicView = (typeof PUBLIC_VIEWS)[number];

export type PublicReadResult = {
  data: readonly Record<string, unknown>[] | null;
  error: { message: string } | null;
};

export type PublicQuery = {
  read(view: PublicView, filters?: Readonly<Record<string, string>>): Promise<PublicReadResult>;
};

type RowQuery = {
  select(columns: string): RowQuery;
  match(filters: Record<string, string>): RowQuery;
  then<T>(
    onfulfilled: (value: { data: unknown[] | null; error: { message: string } | null }) => T,
  ): Promise<T>;
};

export function isSupabaseConfigured(): boolean {
  return readSupabasePublicConfig() !== null;
}

/**
 * Reads the published views. The returned object has no insert, update, or delete.
 * Provider error text is replaced so a response body is not shown in the interface.
 */
export function createPublicQuery(): PublicQuery | null {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  const loose = client as unknown as { from(view: string): RowQuery };
  return {
    async read(view, filters) {
      const result = await loose
        .from(view)
        .select('*')
        .match({ ...filters });
      const data = Array.isArray(result.data)
        ? result.data.filter(
            (row): row is Record<string, unknown> => typeof row === 'object' && row !== null,
          )
        : null;
      return {
        data,
        error: result.error ? { message: 'request failed' } : null,
      };
    },
  };
}
