import { type AppLocale } from '@/modules/localization';

export type ReviewedText = Partial<Record<AppLocale, string>>;

export type RitualRecord = {
  id: string;
  title: ReviewedText;
  /** Null until a reviewer approves the steps. */
  steps: ReviewedText | null;
};

/** Returns only reviewer-approved rituals. The catalog starts empty on purpose. */
export function listReviewedRituals(): readonly RitualRecord[] {
  return [];
}
