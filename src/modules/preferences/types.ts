import { type RashiId, isRashiId } from '@/modules/horoscope';
import { type LocalePreference, isAppLocale } from '@/modules/localization';

export type AppPreferences = {
  locale: LocalePreference;
  rashiId: RashiId | null;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  locale: 'system',
  rashiId: null,
};

export const PREFERENCES_STORAGE_KEY = 'sg.preferences.v1';

export function parsePreferences(value: unknown): AppPreferences {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_PREFERENCES;
  }

  const record = value as Record<string, unknown>;
  const locale: LocalePreference =
    record.locale === 'system' || isAppLocale(record.locale) ? record.locale : 'system';
  const rashiId = isRashiId(record.rashiId) ? record.rashiId : null;

  return { locale, rashiId };
}
