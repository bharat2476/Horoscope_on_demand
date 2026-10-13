import { type AppLocale } from '@/modules/localization';
import { type RitualCategory } from '@/modules/rituals/categories';

import {
  TEMPLE_DIRECTORY_SCOPE,
  type ContentDocument,
  type FestivalDocument,
  type RitualDocument,
  type TempleDocument,
} from '@/modules/content/types';

export type PublicFestival = {
  id: string;
  name: string;
  language: AppLocale;
  regionId: FestivalDocument['regionId'];
  observance: string;
  calendarDate: string;
  convention: string;
  verification: 'verified';
};

export type PublicTemple = {
  id: string;
  name: TempleDocument['name'];
  locality: TempleDocument['descriptions'];
  stateId: string;
  cityId: string | null;
  deity: string;
  directionsUrl: string | null;
  lastVerifiedOn: string;
  verification: 'verified';
};

export function isVerified(document: ContentDocument): boolean {
  return document.review.status === 'published';
}

export function projectPublishedRituals(documents: readonly ContentDocument[]): {
  id: string;
  category: RitualCategory;
  title: RitualDocument['title'];
  steps: Partial<Record<AppLocale, string>> | null;
}[] {
  return documents.filter(isRitual).filter(isVerified).map(toRitualRecord);
}

export function observancesFor(
  documents: readonly ContentDocument[],
  input: { calendarDate: string; regionId: string | null; locale?: AppLocale },
): PublicFestival[] {
  return documents
    .filter(isFestival)
    .filter(isVerified)
    .flatMap((document) => {
      if (document.calendarDate !== input.calendarDate) {
        return [];
      }
      if (
        input.regionId !== null &&
        document.regionId !== null &&
        document.regionId !== input.regionId
      ) {
        return [];
      }
      if (input.regionId === null && document.regionId !== null) {
        return [];
      }
      return [toPublicFestival(document, input.locale ?? document.language)];
    });
}

export function projectPublishedTemples(
  documents: readonly ContentDocument[],
  scope: { deity: string; stateId: string | null } = {
    deity: TEMPLE_DIRECTORY_SCOPE.deity,
    stateId: null,
  },
): PublicTemple[] {
  return documents
    .filter(isTemple)
    .filter(isVerified)
    .flatMap((document) => {
      if (document.deity.trim().toLowerCase() !== scope.deity.trim().toLowerCase()) {
        return [];
      }
      if (scope.stateId && document.stateId !== scope.stateId) {
        return [];
      }
      if (!document.stateId || !document.lastVerifiedOn) {
        return [];
      }
      return [
        {
          id: document.id,
          name: document.name,
          locality: document.descriptions,
          stateId: document.stateId,
          cityId: document.cityId,
          deity: document.deity,
          directionsUrl: directionsUrl(document.latitude, document.longitude),
          lastVerifiedOn: document.lastVerifiedOn,
          verification: 'verified',
        },
      ];
    });
}

export function directionsUrl(latitude: number | null, longitude: number | null): string | null {
  if (latitude === null || longitude === null) {
    return null;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function localizedName(
  values: Partial<Record<AppLocale, string>>,
  locale: AppLocale,
): string | null {
  return (
    values[locale]?.trim() ||
    values.en?.trim() ||
    Object.values(values).find((value) => value?.trim()) ||
    null
  );
}

function toRitualRecord(document: RitualDocument): {
  id: string;
  category: RitualCategory;
  title: RitualDocument['title'];
  steps: Partial<Record<AppLocale, string>> | null;
} {
  const steps = document.steps
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((step) => step.text.trim())
    .filter((text) => text.length > 0)
    .join('\n');
  return {
    id: document.id,
    category: document.category,
    title: document.title,
    steps: steps.length > 0 ? { [document.language]: steps } : null,
  };
}

function toPublicFestival(document: FestivalDocument, locale: AppLocale): PublicFestival {
  return {
    id: document.id,
    name: localizedName(document.name, locale) ?? document.id,
    language: document.language,
    regionId: document.regionId,
    observance: document.observance,
    calendarDate: document.calendarDate ?? '',
    convention: document.convention,
    verification: 'verified',
  };
}

function isRitual(document: ContentDocument): document is RitualDocument {
  return document.kind === 'ritual';
}

function isFestival(document: ContentDocument): document is FestivalDocument {
  return document.kind === 'festival';
}

function isTemple(document: ContentDocument): document is TempleDocument {
  return document.kind === 'temple';
}
