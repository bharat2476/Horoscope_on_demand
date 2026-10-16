import { shiftIsoDate } from '@/modules/calendar/dates';
import { observancesFor, type FestivalDocument, type PublicFestival } from '@/modules/content';
import { type AppLocale } from '@/modules/localization';
import { type StateId } from '@/modules/places';

/** Published festival rows. Empty until a dated observance is approved and published. */
export const PUBLISHED_FESTIVAL_DOCUMENTS: readonly FestivalDocument[] = [];

/** Same window the dashboard uses for upcoming observances. */
const UPCOMING_DAYS = 45;

export type PublishedFestival = {
  id: string;
  name: Partial<Record<AppLocale, string>>;
  language: AppLocale;
  regionId: StateId | null;
  observance: string;
  calendarDate: string;
  convention: string;
};

export type FestivalListing = {
  id: string;
  /** Null when this language has no reviewed name on the published row. */
  name: string | null;
  observance: string;
  calendarDate: string;
};

export type FestivalDay =
  { status: 'unavailable' } | { status: 'listed'; observances: readonly PublicFestival[] };

function nameInLocale(name: Partial<Record<AppLocale, string>>, locale: AppLocale): string | null {
  const value = name[locale]?.trim();
  return value ? value : null;
}

function regionMatches(festivalRegion: StateId | null, selected: string | null): boolean {
  if (selected !== null && festivalRegion !== null && festivalRegion !== selected) {
    return false;
  }
  if (selected === null && festivalRegion !== null) {
    return false;
  }
  return true;
}

/**
 * Lists stored published dates inside the upcoming window.
 * A missing date, another region, or another language does not create a row.
 */
export function listPublishedFestivalListings(
  festivals: readonly PublishedFestival[],
  input: { fromDate: string; locale: AppLocale; regionId: string | null },
): readonly FestivalListing[] {
  const found: FestivalListing[] = [];
  for (let day = 0; day < UPCOMING_DAYS; day += 1) {
    const calendarDate = shiftIsoDate(input.fromDate, day);
    for (const festival of festivals) {
      if (
        festival.calendarDate !== calendarDate ||
        !regionMatches(festival.regionId, input.regionId)
      ) {
        continue;
      }
      found.push({
        id: festival.id,
        name: nameInLocale(festival.name, input.locale),
        observance: festival.observance,
        calendarDate,
      });
    }
  }
  return found;
}

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
