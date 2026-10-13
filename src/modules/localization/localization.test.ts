import {
  APP_LOCALES,
  messages,
  resolveLocale,
  translate,
  type MessageKey,
} from '@/modules/localization';

describe('localization', () => {
  const keys = Object.keys(messages.en) as MessageKey[];

  it('ships every interface string in every supported language', () => {
    expect(APP_LOCALES).toEqual(['en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa']);

    for (const locale of APP_LOCALES) {
      for (const key of keys) {
        expect(translate(locale, key).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('uses an explicit language preference before the device language', () => {
    expect(resolveLocale('ta', 'hi')).toBe('ta');
  });

  it('follows a supported device language when the preference is system', () => {
    expect(resolveLocale('system', 'hi-IN')).toBe('hi');
    expect(resolveLocale('system', 'pa')).toBe('pa');
  });

  it('falls back to English for an unsupported device language', () => {
    expect(resolveLocale('system', 'fr')).toBe('en');
    expect(resolveLocale('system', null)).toBe('en');
  });
});
