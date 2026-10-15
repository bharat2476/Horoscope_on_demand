import { shiftIsoDate } from '@/modules/calendar/dates';
import { observancesFor, type FestivalDocument, type PublicFestival } from '@/modules/content';
import { getFestivalDay } from '@/modules/festivals';
import { getDailyHoroscope, orderRashis, type RashiId } from '@/modules/horoscope';
import { type AppLocale } from '@/modules/localization';
import { getPanchangAvailability } from '@/modules/panchang';
import { getFeaturedRitual } from '@/modules/rituals';
import { listMatajiTemples, type TempleRecord } from '@/modules/temples';

export type ValidatedPanchang = {
  status: 'ready';
  /** Marks a value that came from a validated engine. The loader does not create one. */
  source: 'validated';
  tithi: string;
  nakshatra: string;
  sunrise: string;
  sunset: string;
};

export type DailyPractice = {
  id: string;
  date: string;
  language: AppLocale;
  text: string;
  explanation: string;
  sourceTitle: string;
  sourceCitation: string;
};

/** Reviewed practices only. Empty until an editor publishes one. */
export const PUBLISHED_PRACTICES: readonly DailyPractice[] = [];

export type DashboardModel = {
  date: string;
  panchang: { status: 'unavailable' } | ValidatedPanchang;
  rashis: readonly RashiId[];
  guidance: 'unavailable' | 'published';
  practice:
    | { status: 'unavailable' }
    | { status: 'missing-translation' }
    | { status: 'ready'; practice: DailyPractice };
  festivals:
    { status: 'unavailable' } | { status: 'listed'; observances: readonly PublicFestival[] };
  temples: { status: 'unavailable' } | { status: 'listed'; temples: readonly TempleRecord[] };
  ritual: 'unavailable' | 'published';
};

export function readDailyPractice(
  practices: readonly DailyPractice[],
  date: string,
  locale: AppLocale,
): DashboardModel['practice'] {
  const matches = practices.filter((practice) => practice.date === date);
  const inLanguage = matches.find((practice) => practice.language === locale);
  if (inLanguage) {
    return { status: 'ready', practice: inLanguage };
  }
  if (matches.length > 0) {
    return { status: 'missing-translation' };
  }
  return { status: 'unavailable' };
}

export function listUpcomingFestivals(
  documents: readonly FestivalDocument[],
  fromDate: string,
  locale: AppLocale,
  regionId: string | null,
): readonly PublicFestival[] {
  const found: PublicFestival[] = [];
  for (let day = 0; day < 45; day += 1) {
    const calendarDate = shiftIsoDate(fromDate, day);
    found.push(...observancesFor(documents, { calendarDate, regionId, locale }));
  }
  return found;
}

/**
 * Reads the modules that already exist. It does not invent a tithi, mantra, festival, or temple.
 */
export function loadDashboard(input: {
  date: string;
  locale: AppLocale;
  regionId: string | null;
  preferredRashi: RashiId | null;
  festivals?: readonly FestivalDocument[];
  practices?: readonly DailyPractice[];
}): DashboardModel {
  const availability = getPanchangAvailability();
  const ritual = getFeaturedRitual();
  const guidance = getDailyHoroscope(input.preferredRashi, input.date, input.locale);
  const temples = listMatajiTemples();
  const todayFestival = getFestivalDay(
    input.date,
    { locale: input.locale, regionId: input.regionId },
    input.festivals,
  );
  const upcoming = listUpcomingFestivals(
    input.festivals ?? [],
    input.date,
    input.locale,
    input.regionId,
  );
  return {
    date: input.date,
    panchang: { status: availability.status },
    rashis: orderRashis(input.preferredRashi),
    guidance: guidance.status === 'published' ? 'published' : 'unavailable',
    practice: readDailyPractice(input.practices ?? PUBLISHED_PRACTICES, input.date, input.locale),
    festivals:
      todayFestival.status === 'listed'
        ? todayFestival
        : upcoming.length > 0
          ? { status: 'listed', observances: upcoming }
          : { status: 'unavailable' },
    temples: temples.length > 0 ? { status: 'listed', temples } : { status: 'unavailable' },
    ritual: ritual.status,
  };
}
