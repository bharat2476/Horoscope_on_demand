import { type AppLocale, isAppLocale } from '@/modules/localization/locales';

/**
 * Suggests a language from the phone language only.
 * City, name, and coordinates are not inputs.
 */
export function suggestLanguage(deviceLanguage: string | null): AppLocale | null {
  const primary = deviceLanguage?.split('-')[0]?.toLowerCase() ?? null;
  if (primary && isAppLocale(primary)) {
    return primary;
  }
  return null;
}
