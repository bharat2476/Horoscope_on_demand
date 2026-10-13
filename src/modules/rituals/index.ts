import { type AppLocale } from '@/modules/localization';

export type ReviewedText = Partial<Record<AppLocale, string>>;

export const RITUAL_CATEGORIES = ['daily', 'vrata', 'festival', 'home'] as const;

export type RitualCategory = (typeof RITUAL_CATEGORIES)[number];

export type RitualRecord = {
  id: string;
  category: RitualCategory;
  title: ReviewedText;
  /** Null until a reviewer approves the steps. */
  steps: ReviewedText | null;
};

/** Returns only reviewer-approved rituals. The catalog starts empty on purpose. */
export function listReviewedRituals(): readonly RitualRecord[] {
  return [];
}

export function getFeaturedRitual(): { status: 'unavailable' } {
  return { status: 'unavailable' };
}

export function filterRitualRecords(
  items: readonly RitualRecord[],
  input: { query: string; category: RitualCategory | 'all' },
): readonly RitualRecord[] {
  const query = input.query.trim().toLowerCase();
  return items.filter((item) => {
    if (input.category !== 'all' && item.category !== input.category) {
      return false;
    }
    if (query.length === 0) {
      return true;
    }
    return Object.values(item.title).some((value) => value?.toLowerCase().includes(query));
  });
}

export function filterReviewedRituals(input: {
  query: string;
  category: RitualCategory | 'all';
}): readonly RitualRecord[] {
  return filterRitualRecords(listReviewedRituals(), input);
}
