import { filterReviewedRituals, filterRitualRecords, type RitualRecord } from '@/modules/rituals';

const FIXTURES: RitualRecord[] = [
  { id: 'fixture-vrata', category: 'vrata', title: { en: 'Fixture vrata' }, steps: null },
  { id: 'fixture-daily', category: 'daily', title: { en: 'Fixture lamp' }, steps: null },
];

describe('rituals', () => {
  it('starts with no ritual text', () => {
    expect(filterReviewedRituals({ query: '', category: 'all' })).toEqual([]);
  });

  it('filters fixture records by category and search text', () => {
    expect(filterRitualRecords(FIXTURES, { query: 'vrata', category: 'all' })).toEqual([
      FIXTURES[0],
    ]);
    expect(filterRitualRecords(FIXTURES, { query: '', category: 'daily' })).toEqual([FIXTURES[1]]);
    expect(filterRitualRecords(FIXTURES, { query: 'lamp', category: 'vrata' })).toEqual([]);
  });
});
