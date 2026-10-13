import { getFestivalDay } from '@/modules/festivals';

describe('festivals', () => {
  it('does not name a festival for any date', () => {
    const first = getFestivalDay('2026-10-14');
    const second = getFestivalDay('2026-01-01');

    expect(first).toEqual({ status: 'unavailable' });
    expect(second).toEqual(first);
    expect(Object.keys(first)).toEqual(['status']);
  });
});
