import { exportAnalytics, sanitizeAnalyticsPayload } from '@/modules/analytics';

describe('analytics', () => {
  it('accepts a Rashi id and refuses birth details or coordinates', () => {
    expect(
      sanitizeAnalyticsPayload({
        name: 'rashi_preference_changed',
        properties: { rashiId: 'simha' },
      }),
    ).toEqual({ name: 'rashi_preference_changed', properties: { rashiId: 'simha' } });
    expect(
      sanitizeAnalyticsPayload({
        name: 'activity_day',
        properties: { on: '2026-10-14', longitude: 72.5, traditionId: 'shaiva' },
      }),
    ).toBeNull();
    expect(exportAnalytics()).toBe('not-approved');
  });
});
