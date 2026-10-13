import { getPanchang, getPanchangAvailability } from '@/modules/panchang';

describe('panchang', () => {
  it('does not calculate different values for different places', () => {
    const mumbai = getPanchang({
      calendarDate: '2026-10-13',
      latitude: 19.076,
      longitude: 72.8777,
      timeZone: 'Asia/Kolkata',
    });
    const chennai = getPanchang({
      calendarDate: '2026-10-13',
      latitude: 13.0827,
      longitude: 80.2707,
      timeZone: 'Asia/Kolkata',
    });

    expect(mumbai).toEqual({ status: 'unavailable' });
    expect(chennai).toEqual(mumbai);
    expect(getPanchangAvailability()).toEqual({ status: 'unavailable' });
    expect(Object.keys(mumbai)).toEqual(['status']);
  });
});
