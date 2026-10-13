const PUBLIC_PANCHANG_KEY = /^EXPO_PUBLIC_.*PANCHANG/i;

type SecretEnvironment = Record<string, string | undefined>;

export type CredentialDecision = { ok: true; secret: string } | { ok: false; reason: string };

/**
 * The server process may read PANCHANG_PROVIDER_SECRET.
 * Any EXPO_PUBLIC_ name that mentions Panchang is refused, because Expo inlines those values into the Android bundle.
 */
export function readProviderSecret(env: SecretEnvironment = process.env): CredentialDecision {
  const publicKey = Object.keys(env).find((key) => PUBLIC_PANCHANG_KEY.test(key) && env[key]);
  if (publicKey) {
    return {
      ok: false,
      reason: `${publicKey} would be embedded in the Android bundle.`,
    };
  }
  const secret = env.PANCHANG_PROVIDER_SECRET;
  if (!secret) {
    return { ok: false, reason: 'PANCHANG_PROVIDER_SECRET is not set.' };
  }
  return { ok: true, secret };
}
