import { listMatajiTemples } from '@/modules/temples';

describe('temples', () => {
  it('starts with an empty directory', () => {
    expect(listMatajiTemples()).toEqual([]);
  });
});
