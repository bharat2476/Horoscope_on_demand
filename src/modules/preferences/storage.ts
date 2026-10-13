import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  parsePreferences,
  type AppPreferences,
} from '@/modules/preferences/types';

export async function loadPreferences(): Promise<AppPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored === null) {
      return DEFAULT_PREFERENCES;
    }
    return parsePreferences(JSON.parse(stored) as unknown);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
