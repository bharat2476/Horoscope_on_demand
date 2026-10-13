import { type AppLocale } from '@/modules/localization';

export type TempleRecord = {
  id: string;
  name: Partial<Record<AppLocale, string>>;
  latitude: number;
  longitude: number;
  locality: Partial<Record<AppLocale, string>>;
};

/** Mataji temple directory. Empty until each entry is reviewed. */
export function listMatajiTemples(): readonly TempleRecord[] {
  return [];
}
