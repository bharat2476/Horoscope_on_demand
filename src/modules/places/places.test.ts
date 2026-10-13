import { CITIES, STATES, isCityId, isStateId } from '@/modules/places';

describe('places', () => {
  it('lists each state and city once, without coordinates', () => {
    const stateIds = STATES.map((state) => state.id);
    const cityIds = CITIES.map((city) => city.id);

    expect(new Set(stateIds).size).toBe(stateIds.length);
    expect(STATES).toHaveLength(36);
    expect(new Set(cityIds).size).toBe(cityIds.length);

    for (const state of STATES) {
      expect(Object.keys(state).sort()).toEqual(['id', 'name']);
      expect(CITIES.some((city) => city.stateId === state.id)).toBe(true);
    }

    for (const city of CITIES) {
      expect(isStateId(city.stateId)).toBe(true);
      expect(Object.keys(city).sort()).toEqual(['id', 'name', 'stateId']);
    }

    expect(isCityId('mh-mumbai')).toBe(true);
    expect(isCityId('not-a-city')).toBe(false);
  });
});
