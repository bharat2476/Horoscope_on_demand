export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

/**
 * An empty value is a local development build.
 * Any other unknown value fails the build instead of silently shipping as production.
 */
export function parseAppEnvironment(value: string | undefined): AppEnvironment {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0) {
    return 'development';
  }
  if (normalized === 'development' || normalized === 'staging' || normalized === 'production') {
    return normalized;
  }
  throw new Error(`Unknown app environment: ${normalized}`);
}

export function readAppEnvironment(): AppEnvironment {
  return parseAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
}
