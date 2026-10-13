import { type RashiId, isRashiId } from '@/modules/horoscope';
import { type LocalePreference, isAppLocale } from '@/modules/localization';
import { isCityId, type CityId } from '@/modules/places';
import {
  DEFAULT_NOTIFICATIONS,
  parseNotificationPreferences,
  type NotificationPreferences,
} from '@/modules/preferences/notifications';
import { isTraditionId, type TraditionId } from '@/modules/preferences/traditions';

export type AppPreferences = {
  locale: LocalePreference;
  rashiId: RashiId | null;
  cityId: CityId | null;
  traditionId: TraditionId | null;
  notifications: NotificationPreferences;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  locale: 'system',
  rashiId: null,
  cityId: null,
  traditionId: null,
  notifications: DEFAULT_NOTIFICATIONS,
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
  const cityId = isCityId(record.cityId) ? record.cityId : null;
  const traditionId = isTraditionId(record.traditionId) ? record.traditionId : null;
  const notifications = parseNotificationPreferences(record.notifications);

  return { locale, rashiId, cityId, traditionId, notifications };
}
