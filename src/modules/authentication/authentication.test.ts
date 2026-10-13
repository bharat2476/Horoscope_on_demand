import { getSupabaseClient } from '@/modules/authentication/client';
import { parseSupabasePublicConfig } from '@/modules/authentication/config';

describe('authentication config', () => {
  it('requires both public values and ignores blanks', () => {
    expect(parseSupabasePublicConfig(undefined, undefined)).toBeNull();
    expect(parseSupabasePublicConfig('https://example.supabase.co', '   ')).toBeNull();
    expect(parseSupabasePublicConfig('  ', 'anon-key')).toBeNull();
    expect(parseSupabasePublicConfig(' https://example.supabase.co ', ' anon-key ')).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('does not create a client when public config is absent', () => {
    expect(getSupabaseClient()).toBeNull();
  });
});
