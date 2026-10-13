import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { noopAnalytics } from '@/modules/analytics';
import { getAuthAvailability, type AuthAvailability } from '@/modules/authentication';
import { type RashiId } from '@/modules/horoscope';
import {
  readDeviceLanguageCode,
  resolveLocale,
  translate,
  type AppLocale,
  type LocalePreference,
  type MessageKey,
} from '@/modules/localization';
import { type CityId } from '@/modules/places';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type AppPreferences,
  type NotificationChannel,
  type TraditionId,
} from '@/modules/preferences';

type AppContextValue = {
  ready: boolean;
  locale: AppLocale;
  localePreference: LocalePreference;
  setLocalePreference: (preference: LocalePreference) => void;
  rashiId: RashiId | null;
  setRashiId: (rashiId: RashiId | null) => void;
  cityId: CityId | null;
  setCityId: (cityId: CityId | null) => void;
  traditionId: TraditionId | null;
  setTraditionId: (traditionId: TraditionId | null) => void;
  notifications: AppPreferences['notifications'];
  setNotificationChannel: (channel: NotificationChannel, enabled: boolean) => void;
  replacePreferences: (next: AppPreferences) => void;
  t: (key: MessageKey) => string;
  authStatus: AuthAvailability['status'];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreferences()
      .then((loaded) => {
        if (active) {
          setPreferences(loaded);
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const setLocalePreference = useCallback((localePreference: LocalePreference) => {
    setPreferences((current) => {
      const next = { ...current, locale: localePreference };
      void savePreferences(next);
      return next;
    });
    noopAnalytics.track({
      name: 'locale_changed',
      properties: { locale: localePreference },
    });
  }, []);

  const setRashiId = useCallback((rashiId: RashiId | null) => {
    setPreferences((current) => {
      const next = { ...current, rashiId };
      void savePreferences(next);
      return next;
    });
    noopAnalytics.track({
      name: 'rashi_preference_changed',
      properties: { selected: rashiId !== null },
    });
  }, []);

  const setCityId = useCallback((cityId: CityId | null) => {
    setPreferences((current) => {
      const next = { ...current, cityId };
      void savePreferences(next);
      return next;
    });
    noopAnalytics.track({
      name: 'city_preference_changed',
      properties: { selected: cityId !== null },
    });
  }, []);

  const setTraditionId = useCallback((traditionId: TraditionId | null) => {
    setPreferences((current) => {
      const next = { ...current, traditionId };
      void savePreferences(next);
      return next;
    });
    noopAnalytics.track({
      name: 'tradition_preference_changed',
      properties: { selected: traditionId !== null },
    });
  }, []);

  const setNotificationChannel = useCallback((channel: NotificationChannel, enabled: boolean) => {
    setPreferences((current) => {
      const next = {
        ...current,
        notifications: { ...current.notifications, delivery: 'off' as const, [channel]: enabled },
      };
      void savePreferences(next);
      return next;
    });
    noopAnalytics.track({
      name: 'notification_preference_changed',
      properties: { selected: enabled },
    });
  }, []);

  const replacePreferences = useCallback((next: AppPreferences) => {
    setPreferences(next);
    void savePreferences(next);
  }, []);

  const locale = resolveLocale(preferences.locale, readDeviceLanguageCode());
  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);
  const authStatus = getAuthAvailability().status;

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      locale,
      localePreference: preferences.locale,
      setLocalePreference,
      rashiId: preferences.rashiId,
      setRashiId,
      cityId: preferences.cityId,
      setCityId,
      traditionId: preferences.traditionId,
      setTraditionId,
      notifications: preferences.notifications,
      setNotificationChannel,
      replacePreferences,
      t,
      authStatus,
    }),
    [
      authStatus,
      locale,
      preferences.locale,
      preferences.rashiId,
      preferences.cityId,
      preferences.traditionId,
      preferences.notifications,
      ready,
      setLocalePreference,
      setRashiId,
      setCityId,
      setTraditionId,
      setNotificationChannel,
      replacePreferences,
      t,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within AppProvider');
  }
  return value;
}
