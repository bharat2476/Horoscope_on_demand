import { type AppLocale } from '@/modules/localization';
import {
  projectPublishedTemples,
  TEMPLE_DIRECTORY_SCOPE,
  type TempleDocument,
} from '@/modules/content';

export type TempleRecord = {
  id: string;
  name: Partial<Record<AppLocale, string>>;
  locality: Partial<Record<AppLocale, string>>;
  stateId: string;
  cityId: string | null;
  directionsUrl?: string | null;
  verification?: 'verified';
  lastVerifiedOn?: string;
};

/** Published temple documents. The Gujarat Mataji directory starts empty. */
export const PUBLISHED_TEMPLE_DOCUMENTS: readonly TempleDocument[] = [];

export function listMatajiTemples(
  documents: readonly TempleDocument[] = PUBLISHED_TEMPLE_DOCUMENTS,
): readonly TempleRecord[] {
  return projectPublishedTemples(documents, {
    deity: TEMPLE_DIRECTORY_SCOPE.deity,
    stateId: null,
  });
}

export function listGujaratMatajiTemples(
  documents: readonly TempleDocument[] = PUBLISHED_TEMPLE_DOCUMENTS,
): readonly TempleRecord[] {
  return projectPublishedTemples(documents, {
    deity: TEMPLE_DIRECTORY_SCOPE.deity,
    stateId: TEMPLE_DIRECTORY_SCOPE.stateId,
  });
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
