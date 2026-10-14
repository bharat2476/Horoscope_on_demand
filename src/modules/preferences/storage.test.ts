import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_NOTIFICATIONS, loadPreferences, PREFERENCES_STORAGE_KEY, savePreferences } from '@/modules/preferences';

describe('preference storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips language, Rashi, and city', async () => {
    await savePreferences({
      locale: 'gu',
      rashiId: 'kanya',
      cityId: 'gj-ahmedabad',
      traditionId: 'shakta',
      notifications: { ...DEFAULT_NOTIFICATIONS, rituals: true },
    });
    await expect(loadPreferences()).resolves.toEqual({
      locale: 'gu',
      rashiId: 'kanya',
      cityId: 'gj-ahmedabad',
      traditionId: 'shakta',
      notifications: { ...DEFAULT_NOTIFICATIONS, rituals: true },
    });
    await expect(AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)).resolves.toContain('kanya');
  });

  it('ignores corrupt stored data', async () => {
    await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, '{');
    await expect(loadPreferences()).resolves.toEqual({
      locale: 'system',
      rashiId: null,
      cityId: null,
      traditionId: null,
      notifications: DEFAULT_NOTIFICATIONS,
    });
  });
});
