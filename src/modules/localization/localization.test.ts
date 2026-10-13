import {
  APP_LOCALES,
  messages,
  resolveLocale,
  translate,
  type AppLocale,
  type MessageKey,
} from '@/modules/localization';

const SCRIPT: Record<AppLocale, RegExp> = {
  en: /[A-Za-z]/,
  hi: /[\u0900-\u097F]/,
  mr: /[\u0900-\u097F]/,
  gu: /[\u0A80-\u0AFF]/,
  pa: /[\u0A00-\u0A7F]/,
  bn: /[\u0980-\u09FF]/,
  ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/,
  kn: /[\u0C80-\u0CFF]/,
  ml: /[\u0D00-\u0D7F]/,
};

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

  it('uses the script for each language and keeps replacement characters out', () => {
    for (const locale of APP_LOCALES) {
      const values = Object.values(messages[locale]);
      const withScript = values.filter((value) => SCRIPT[locale].test(value));
      expect(withScript.length).toBeGreaterThan(values.length * 0.8);
      expect(values.join('\n')).not.toContain('\uFFFD');
    }
  });

  it('falls back to English for an unsupported device language', () => {
    expect(resolveLocale('system', 'fr')).toBe('en');
    expect(resolveLocale('system', null)).toBe('en');
  });
});
