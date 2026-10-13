import { type AppLocale } from '@/modules/localization';

export type TempleRecord = {
  id: string;
  name: Partial<Record<AppLocale, string>>;
  locality: Partial<Record<AppLocale, string>>;
  stateId: string;
  cityId: string;
};

/** Mataji temple directory. Empty until each entry is reviewed. */
export function listMatajiTemples(): readonly TempleRecord[] {
  return [];
}

export function filterTempleRecords(
  items: readonly TempleRecord[],
  input: { query: string; stateId: string | null; cityId: string | null },
): readonly TempleRecord[] {
  const query = input.query.trim().toLowerCase();
  return items.filter((item) => {
    if (input.stateId && item.stateId !== input.stateId) {
      return false;
    }
    if (input.cityId && item.cityId !== input.cityId) {
      return false;
    }
    if (query.length === 0) {
      return true;
    }
    const names = [item.name, item.locality].flatMap((copy) => Object.values(copy));
    return names.some((value) => value?.toLowerCase().includes(query));
  });
}

export function filterMatajiTemples(input: {
  query: string;
  stateId: string | null;
  cityId: string | null;
}): readonly TempleRecord[] {
  return filterTempleRecords(listMatajiTemples(), input);
}
