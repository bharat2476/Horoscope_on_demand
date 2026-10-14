import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_GROWTH, parseGrowthState, type GrowthState } from '@/modules/growth/metrics';

export const GROWTH_STORAGE_KEY = 'sg.growth.v1';

export async function loadGrowthState(): Promise<GrowthState> {
  try {
    const stored = await AsyncStorage.getItem(GROWTH_STORAGE_KEY);
    if (stored === null) {
      return DEFAULT_GROWTH;
    }
    return parseGrowthState(JSON.parse(stored) as unknown);
  } catch {
    return DEFAULT_GROWTH;
  }
}

export async function saveGrowthState(state: GrowthState): Promise<void> {
  await AsyncStorage.setItem(GROWTH_STORAGE_KEY, JSON.stringify(state));
}
