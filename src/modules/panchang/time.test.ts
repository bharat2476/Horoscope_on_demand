import { activeInterval } from '@/modules/panchang/compare';
import { civilDate, formatInstant, instantInTimeZone, parseInstant } from '@/modules/panchang/time';

describe('panchang time', () => {
  it('rejects a civil time that has no offset', () => {
    expect(() => parseInstant('2026-10-14T00:00:00')).toThrow(/offset/);
  });

  it('keeps the Kolkata civil date across the UTC midnight boundary', () => {
    expect(civilDate('2026-10-13T18:30:00Z', 'Asia/Kolkata')).toBe('2026-10-14');
    expect(civilDate('2026-10-13T18:29:59Z', 'Asia/Kolkata')).toBe('2026-10-13');
    expect(civilDate('2026-10-14T00:00:00+05:30', 'Asia/Kolkata')).toBe('2026-10-14');
  });

  it('writes midnight in Asia/Kolkata with the +05:30 offset', () => {
    expect(instantInTimeZone('2026-10-14', '00:00:00', 'Asia/Kolkata')).toBe(
      '2026-10-14T00:00:00+05:30',
    );
    expect(formatInstant(Date.parse('2026-10-13T18:30:00Z'), 'Asia/Kolkata')).toBe(
      '2026-10-14T00:00:00+05:30',
    );
    expect(formatInstant(Date.parse('2026-10-13T18:30:00.400Z'), 'Asia/Kolkata')).toMatch(
      /\+05:30$/,
    );
  });

  it('uses the offset in effect for a zone that observes daylight saving', () => {
    expect(instantInTimeZone('2026-10-14', '00:00:00', 'America/New_York')).toBe(
      '2026-10-14T00:00:00-04:00',
    );
    expect(instantInTimeZone('2026-11-03', '00:00:00', 'America/New_York')).toBe(
      '2026-11-03T00:00:00-05:00',
    );
  });

  it('selects the element in force at a transition instant', () => {
    const boundary = '2026-10-14T06:30:00+05:30';
    const intervals = [
      {
        id: 'fixture-tithi-a',
        name: 'fixture-tithi-a',
        start: '2026-10-13T06:30:00+05:30',
        end: boundary,
      },
      {
        id: 'fixture-tithi-b',
        name: 'fixture-tithi-b',
        start: boundary,
        end: '2026-10-15T06:30:00+05:30',
      },
    ];

    expect(activeInterval(intervals, '2026-10-14T06:29:59+05:30')?.id).toBe('fixture-tithi-a');
    expect(activeInterval(intervals, boundary)?.id).toBe('fixture-tithi-b');
  });
});
