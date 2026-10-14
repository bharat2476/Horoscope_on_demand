import { DEMO_BANNER_UNIT_ID, LIVE_ADS_APPROVED, resolveAdRequest } from '@/modules/ads/request';

describe('ad requests', () => {
  const allowed = {
    environment: 'development' as const,
    ageBand: '18-plus' as const,
    adChoice: 'non-personalized' as const,
    placement: 'content-break',
  };

  it('uses the Google demo banner only after an adult non-personalized choice', () => {
    expect(LIVE_ADS_APPROVED).toBe(false);
    expect(resolveAdRequest(allowed)).toEqual({
      status: 'test',
      appId: 'ca-app-pub-3940256099942544~3347511713',
      unitId: DEMO_BANNER_UNIT_ID,
      personalized: false,
    });
  });

  it('withholds ads for production, children, missing consent, personalization, and navigation', () => {
    expect(resolveAdRequest({ ...allowed, environment: 'production' }).status).toBe('unavailable');
    expect(resolveAdRequest({ ...allowed, ageBand: 'under-18' }).status).toBe('unavailable');
    expect(resolveAdRequest({ ...allowed, ageBand: 'unknown' }).status).toBe('unavailable');
    expect(resolveAdRequest({ ...allowed, adChoice: 'unset' }).status).toBe('unavailable');
    expect(resolveAdRequest({ ...allowed, adChoice: 'personalized' }).status).toBe('unavailable');
    expect(resolveAdRequest({ ...allowed, placement: 'tab-bar' }).status).toBe('unavailable');
  });
});
