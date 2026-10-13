import { DEFAULT_PREFERENCES, parsePreferences } from '@/modules/preferences';

describe('preferences', () => {
  it('stores language, an optional Rashi, and an optional city', () => {
    expect(Object.keys(DEFAULT_PREFERENCES).sort()).toEqual(['cityId', 'locale', 'rashiId']);
    expect(DEFAULT_PREFERENCES).toEqual({ locale: 'system', rashiId: null, cityId: null });
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
    ).toEqual({ locale: 'hi', rashiId: 'simha', cityId: 'mh-pune' });
    expect(parsePreferences({ locale: 'fr', rashiId: 'not-a-rashi', cityId: 'atlantis' })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('reads an older saved preference that has no city', () => {
    expect(parsePreferences({ locale: 'ta', rashiId: 'mesha' })).toEqual({
      locale: 'ta',
      rashiId: 'mesha',
      cityId: null,
    });
  });
});
