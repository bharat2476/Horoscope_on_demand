import { todayIsoDate } from '@/modules/calendar/dates';
import { type AppLocale } from '@/modules/localization';

import { PUBLISHED_DAILY_READINGS, readPublishedReading } from '@/modules/horoscope/daily';
import { isRashiId, type RashiId } from '@/modules/horoscope/rashis';

export { RASHIS, isRashiId, type RashiId } from '@/modules/horoscope/rashis';
export {
  DEVELOPMENT_DAILY_EXAMPLE,
  PUBLISHED_DAILY_READINGS,
  adjacentRashi,
  orderRashis,
  publishDailyReading,
  readPublishedReading,
  shareHoroscopeCard,
  visibleToAnonymous,
  type DailyReading,
  type ReadingLookup,
  type SourceType,
} from '@/modules/horoscope/daily';

export type DailyHoroscopeResult =
  | { status: 'unavailable'; rashiId: RashiId | null }
  | { status: 'published'; rashiId: RashiId; date: string };

/**
 * General Rashi horoscopes do not use birth date, birth time, or birthplace.
 * A day with no published review stays unavailable. Nothing is invented here.
 */
export function getDailyHoroscope(
  rashiId: RashiId | null,
  date = todayIsoDate(),
  locale: AppLocale = 'en',
): DailyHoroscopeResult {
  if (!rashiId || !isRashiId(rashiId)) {
    return { status: 'unavailable', rashiId: null };
  }
  const lookup = readPublishedReading(PUBLISHED_DAILY_READINGS, { date, rashiId, locale });
  if (lookup.status !== 'published') {
    return { status: 'unavailable', rashiId };
  }
  return { status: 'published', rashiId, date };
}
