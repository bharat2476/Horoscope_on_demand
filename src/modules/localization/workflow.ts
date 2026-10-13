import { APP_LOCALES, type AppLocale } from '@/modules/localization/locales';

/**
 * English is the source catalog. A new key is added there first.
 * Every other catalog must contain the same key before the tests pass.
 * Indic copy stays draft until a native speaker records a review. None is recorded yet.
 */
export const TRANSLATION_SOURCE: AppLocale = 'en';

export type TranslationReview = 'source' | 'draft' | 'reviewed';

export const REVIEWED_LOCALES: readonly AppLocale[] = [];

export function translationReview(locale: AppLocale): TranslationReview {
  if (locale === TRANSLATION_SOURCE) {
    return 'source';
  }
  if (REVIEWED_LOCALES.includes(locale)) {
    return 'reviewed';
  }
  return 'draft';
}

export function unreviewedLocales(): AppLocale[] {
  return APP_LOCALES.filter((locale) => translationReview(locale) === 'draft');
}
