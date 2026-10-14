import { DEFAULT_NOTIFICATIONS, DEFAULT_PREFERENCES, parsePreferences } from '@/modules/preferences';

describe('preferences', () => {
  it('stores language, an optional Rashi, and an optional city', () => {
    expect(Object.keys(DEFAULT_PREFERENCES).sort()).toEqual([
      'cityId',
      'locale',
      'notifications',
      'rashiId',
      'traditionId',
    ]);
    expect(DEFAULT_PREFERENCES).toEqual({
      locale: 'system',
      rashiId: null,
      cityId: null,
      traditionId: null,
      notifications: DEFAULT_NOTIFICATIONS,
    });
  });

  it('drops unknown or malformed values', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('not-json')).toEqual(DEFAULT_PREFERENCES);
    expect(
      parsePreferences({
        locale: 'hi',
        rashiId: 'simha',
        cityId: 'mh-pune',
        birthDate: '2000-01-01',
        birthTime: '06:30',
        birthplace: 'Pune',
      }),
    ).toEqual({
      locale: 'hi',
      rashiId: 'simha',
      cityId: 'mh-pune',
      traditionId: null,
      notifications: DEFAULT_NOTIFICATIONS,
    });
    expect(parsePreferences({ locale: 'fr', rashiId: 'not-a-rashi', cityId: 'atlantis' })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('reads an older saved preference that has no city', () => {
    expect(parsePreferences({ locale: 'ta', rashiId: 'mesha' })).toEqual({
      locale: 'ta',
      rashiId: 'mesha',
      cityId: null,
      traditionId: null,
      notifications: DEFAULT_NOTIFICATIONS,
    });
    expect(
      parsePreferences({
        locale: 'en',
        cityId: 'gj-ahmedabad',
        traditionId: 'shaiva',
        latitude: 23.03,
        longitude: 72.58,
        notifications: { delivery: 'on', festivals: true, rituals: false },
      }),
    ).toEqual({
      locale: 'en',
      rashiId: null,
      cityId: 'gj-ahmedabad',
      traditionId: 'shaiva',
      notifications: { ...DEFAULT_NOTIFICATIONS, festivals: true },
    });
  });
});
