import { DEFAULT_PREFERENCES, parsePreferences } from '@/modules/preferences';

describe('preferences', () => {
  it('stores only language and an optional Rashi', () => {
    expect(Object.keys(DEFAULT_PREFERENCES).sort()).toEqual(['locale', 'rashiId']);
    expect(DEFAULT_PREFERENCES).toEqual({ locale: 'system', rashiId: null });
  });

  it('drops unknown or malformed values', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('not-json')).toEqual(DEFAULT_PREFERENCES);
    expect(
      parsePreferences({
        locale: 'hi',
        rashiId: 'simha',
        birthDate: '2000-01-01',
        birthTime: '06:30',
        birthplace: 'Pune',
      }),
    ).toEqual({ locale: 'hi', rashiId: 'simha' });
    expect(parsePreferences({ locale: 'fr', rashiId: 'not-a-rashi' })).toEqual(DEFAULT_PREFERENCES);
  });
});
