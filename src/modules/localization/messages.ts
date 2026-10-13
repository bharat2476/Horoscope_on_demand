import { bn } from '@/modules/localization/catalogs/bn';
import { en, type MessageKey } from '@/modules/localization/catalogs/en';
import { gu } from '@/modules/localization/catalogs/gu';
import { hi } from '@/modules/localization/catalogs/hi';
import { kn } from '@/modules/localization/catalogs/kn';
import { ml } from '@/modules/localization/catalogs/ml';
import { mr } from '@/modules/localization/catalogs/mr';
import { pa } from '@/modules/localization/catalogs/pa';
import { ta } from '@/modules/localization/catalogs/ta';
import { te } from '@/modules/localization/catalogs/te';
import { type AppLocale } from '@/modules/localization/locales';

export type { MessageKey };

export const messages: Record<AppLocale, Record<MessageKey, string>> = {
  en,
  hi,
  gu,
  ta,
  ml,
  mr,
  kn,
  te,
  bn,
  pa,
};

export function translate(locale: AppLocale, key: MessageKey): string {
  return messages[locale][key];
}
