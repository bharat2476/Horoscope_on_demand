import { getDailyHoroscope, RASHIS, isRashiId } from '@/modules/horoscope';

describe('horoscope', () => {
  it('lists the twelve Rashi labels and no reading', () => {
    expect(RASHIS).toHaveLength(12);
    expect(isRashiId('mesha')).toBe(true);
    expect(isRashiId('birth-chart')).toBe(false);

    const result = getDailyHoroscope('mesha');

    expect(result).toEqual({ status: 'unavailable', rashiId: 'mesha' });
    expect(Object.keys(result).sort()).toEqual(['rashiId', 'status']);
  });

  it('does not invent a reading when no Rashi is selected', () => {
    expect(getDailyHoroscope(null)).toEqual({ status: 'unavailable', rashiId: null });
  });
});
