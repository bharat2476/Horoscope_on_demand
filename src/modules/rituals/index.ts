import { projectPublishedRituals, type RitualDocument } from '@/modules/content';
import { type AppLocale } from '@/modules/localization';
import { type RitualCategory } from '@/modules/rituals/categories';

export { RITUAL_CATEGORIES, type RitualCategory } from '@/modules/rituals/categories';

export type ReviewedText = Partial<Record<AppLocale, string>>;

export type RitualRecord = {
  id: string;
  category: RitualCategory;
  title: ReviewedText;
  /** Null until a reviewer approves the steps. */
  steps: ReviewedText | null;
};

/** Published rituals loaded from the review workflow. Empty until an editor publishes one. */
export const PUBLISHED_RITUAL_DOCUMENTS: readonly RitualDocument[] = [];

/** Returns only reviewer-approved, published rituals. */
export function listReviewedRituals(
  documents: readonly RitualDocument[] = PUBLISHED_RITUAL_DOCUMENTS,
): readonly RitualRecord[] {
  return projectPublishedRituals(documents);
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
