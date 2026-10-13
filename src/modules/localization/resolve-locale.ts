import { getLocales } from 'expo-localization';

import { type AppLocale, isAppLocale } from '@/modules/localization/locales';

export type LocalePreference = AppLocale | 'system';

export function readDeviceLanguageCode(): string | null {
  const code = getLocales()[0]?.languageCode;
  return code && code.length > 0 ? code : null;
}

export function resolveLocale(
  preference: LocalePreference,
  deviceLanguage: string | null,
): AppLocale {
  if (preference !== 'system') {
    return preference;
  }

  const primary = deviceLanguage?.split('-')[0]?.toLowerCase() ?? null;
  if (primary && isAppLocale(primary)) {
    return primary;
  }

  return 'en';
}
