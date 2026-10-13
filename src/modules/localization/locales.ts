export const APP_LOCALES = ['en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_ENDONYMS: Record<AppLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી',
  ta: 'தமிழ்',
  ml: 'മലയാളം',
  mr: 'मराठी',
  kn: 'ಕನ್ನಡ',
  te: 'తెలుగు',
  bn: 'বাংলা',
  pa: 'ਪੰਜਾਬੀ',
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}
