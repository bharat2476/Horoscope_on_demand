import { listReviewedRituals } from '@/modules/rituals';

describe('rituals', () => {
  it('starts with no ritual text', () => {
    expect(listReviewedRituals()).toEqual([]);
  });
});
