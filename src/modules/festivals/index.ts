import { observancesFor, type FestivalDocument, type PublicFestival } from '@/modules/content';
import { type AppLocale } from '@/modules/localization';

/** Published festival rows. Empty until a dated observance is approved and published. */
export const PUBLISHED_FESTIVAL_DOCUMENTS: readonly FestivalDocument[] = [];

export type FestivalDay =
  { status: 'unavailable' } | { status: 'listed'; observances: readonly PublicFestival[] };

/**
 * Returns stored observances for a civil date and, when supplied, a region.
 * A missing row stays unavailable. No date is inferred from the festival name.
 */
export function getFestivalDay(
  isoDate: string,
  options: { regionId?: string | null; locale?: AppLocale } = {},
  documents: readonly FestivalDocument[] = PUBLISHED_FESTIVAL_DOCUMENTS,
): FestivalDay {
  const matches = observancesFor(documents, {
    calendarDate: isoDate,
    regionId: options.regionId ?? null,
    locale: options.locale,
  });
  if (matches.length === 0) {
    return { status: 'unavailable' };
  }
  return { status: 'listed', observances: matches };
}
