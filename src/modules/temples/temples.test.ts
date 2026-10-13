import { filterMatajiTemples, filterTempleRecords, type TempleRecord } from '@/modules/temples';

const FIXTURES: TempleRecord[] = [
  {
    id: 'fixture-pune',
    name: { en: 'Fixture Mataji' },
    locality: { en: 'Fixture locality' },
    stateId: 'mh',
    cityId: 'mh-pune',
  },
  {
    id: 'fixture-ahmedabad',
    name: { en: 'Other fixture' },
    locality: { en: 'West locality' },
    stateId: 'gj',
    cityId: 'gj-ahmedabad',
  },
];

describe('temples', () => {
  it('starts with an empty directory', () => {
    expect(filterMatajiTemples({ query: '', stateId: null, cityId: null })).toEqual([]);
  });

  it('filters fixture records by place and search text', () => {
    expect(filterTempleRecords(FIXTURES, { query: '', stateId: 'mh', cityId: null })).toEqual([
      FIXTURES[0],
    ]);
    expect(filterTempleRecords(FIXTURES, { query: 'west', stateId: null, cityId: null })).toEqual([
      FIXTURES[1],
    ]);
    expect(
      filterTempleRecords(FIXTURES, { query: 'fixture', stateId: 'gj', cityId: 'mh-pune' }),
    ).toEqual([]);
  });
});
