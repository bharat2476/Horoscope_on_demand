export {
  APP_LOCALES,
  isAppLocale,
  LOCALE_ENDONYMS,
  type AppLocale,
} from '@/modules/localization/locales';
export { messages, translate, type MessageKey } from '@/modules/localization/messages';
export {
  readDeviceLanguageCode,
  resolveLocale,
  type LocalePreference,
} from '@/modules/localization/resolve-locale';
export {
  preserveSanskrit,
  hasDevanagari,
  sanskritTextStyle,
} from '@/modules/localization/sanskrit';
export { suggestLanguage } from '@/modules/localization/suggest-language';
export {
  REVIEWED_LOCALES,
  TRANSLATION_SOURCE,
  translationReview,
  unreviewedLocales,
  type TranslationReview,
} from '@/modules/localization/workflow';
