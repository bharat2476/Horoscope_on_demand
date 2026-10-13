export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type AuthAvailability = { status: 'unconfigured' } | { status: 'configured' };

function normalize(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Both public values are required. A service-role key must never be passed here.
 */
export function parseSupabasePublicConfig(
  url: string | undefined,
  anonKey: string | undefined,
): SupabasePublicConfig | null {
  const normalizedUrl = normalize(url);
  const normalizedKey = normalize(anonKey);
  if (!normalizedUrl || !normalizedKey) {
    return null;
  }
  return { url: normalizedUrl, anonKey: normalizedKey };
}

export function readSupabasePublicConfig(): SupabasePublicConfig | null {
  return parseSupabasePublicConfig(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getAuthAvailability(): AuthAvailability {
  return readSupabasePublicConfig() ? { status: 'configured' } : { status: 'unconfigured' };
}
