import { noopAnalytics } from '@/modules/analytics';

describe('analytics', () => {
  it('accepts events without sending them', () => {
    expect(() =>
      noopAnalytics.track({
        name: 'rashi_preference_changed',
        properties: { selected: false },
      }),
    ).not.toThrow();
  });
});
