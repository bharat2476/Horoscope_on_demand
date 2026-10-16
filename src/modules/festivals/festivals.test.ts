import { shiftIsoDate } from '@/modules/calendar/dates';
import {
  getFestivalDay,
  listPublishedFestivalListings,
  type PublishedFestival,
} from '@/modules/festivals';

describe('festivals', () => {
  it('does not name a festival for any date', () => {
    const first = getFestivalDay('2026-10-14');
    const second = getFestivalDay('2026-01-01');

    expect(first).toEqual({ status: 'unavailable' });
    expect(second).toEqual(first);
    expect(Object.keys(first)).toEqual(['status']);
  });

  it('keeps a stored date in the upcoming window and drops other regions and languages', () => {
    const stored: PublishedFestival = {
      id: 'fixture-festival',
      name: { en: 'Fixture observance' },
      language: 'en',
      regionId: null,
      observance: 'Fixture observance details.',
      calendarDate: '2026-10-16',
      convention: 'Stored date with no regional override.',
    };
    const regional: PublishedFestival = {
      ...stored,
      id: 'fixture-regional',
      regionId: 'gj',
      calendarDate: '2026-10-20',
    };
    const later: PublishedFestival = {
      ...stored,
      id: 'fixture-later',
      calendarDate: shiftIsoDate('2026-10-16', 45),
    };

    expect(
      listPublishedFestivalListings([stored, regional, later], {
        fromDate: '2026-10-16',
        locale: 'en',
        regionId: null,
      }),
    ).toEqual([
      {
        id: 'fixture-festival',
        name: 'Fixture observance',
        observance: 'Fixture observance details.',
        calendarDate: '2026-10-16',
      },
    ]);
    expect(
      listPublishedFestivalListings([stored], {
        fromDate: '2026-10-16',
        locale: 'hi',
        regionId: null,
      })[0]?.name,
    ).toBeNull();
    expect(
      listPublishedFestivalListings([regional], {
        fromDate: '2026-10-16',
        locale: 'en',
        regionId: 'gj',
      }).map((item) => item.id),
    ).toEqual(['fixture-regional']);
    expect(
      listPublishedFestivalListings([], {
        fromDate: '2026-10-16',
        locale: 'en',
        regionId: 'gj',
      }),
    ).toEqual([]);
  });
});
