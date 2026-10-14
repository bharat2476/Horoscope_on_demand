import {
  REVIEW_ISSUES,
  type CustomerBooking,
  type ReviewIssue,
  type ReviewRecord,
} from '@/modules/puja/types';

export type ReviewDraft = {
  booking: CustomerBooking;
  customerId: string | null;
  priestId: string | null;
  rating: number;
  feedback: string | null;
  issues: readonly string[];
  existing: ReviewRecord | null;
};

export function submitReview(draft: ReviewDraft):
  | { ok: true; review: ReviewRecord }
  | {
      ok: false;
      reason: 'forbidden' | 'not_completed' | 'invalid_rating' | 'invalid_issue' | 'edit_closed';
    } {
  if (!draft.customerId || draft.booking.customerId !== draft.customerId) {
    return { ok: false, reason: 'forbidden' };
  }
  if (
    draft.booking.status !== 'completed' ||
    !draft.priestId ||
    draft.priestId !== draft.booking.assignedPriestId
  ) {
    return { ok: false, reason: 'not_completed' };
  }
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
    return { ok: false, reason: 'invalid_rating' };
  }
  const issues: ReviewIssue[] = [];
  for (const issue of draft.issues) {
    if (!(REVIEW_ISSUES as readonly string[]).includes(issue)) {
      return { ok: false, reason: 'invalid_issue' };
    }
    issues.push(issue as ReviewIssue);
  }
  if (draft.existing) {
    if (
      draft.existing.bookingId !== draft.booking.id ||
      draft.existing.hidden ||
      draft.existing.editCount >= 1
    ) {
      return { ok: false, reason: 'edit_closed' };
    }
    return {
      ok: true,
      review: {
        ...draft.existing,
        rating: draft.rating,
        feedback: blankToNull(draft.feedback),
        issues,
        editCount: draft.existing.editCount + 1,
      },
    };
  }
  return {
    ok: true,
    review: {
      bookingId: draft.booking.id,
      customerId: draft.customerId,
      priestId: draft.priestId,
      rating: draft.rating,
      feedback: blankToNull(draft.feedback),
      issues,
      hidden: false,
      editCount: 0,
    },
  };
}

export function flagReview(
  actorKind: 'admin' | 'customer' | 'priest',
  review: ReviewRecord,
  reason: string,
): { ok: true; review: ReviewRecord } | { ok: false; reason: 'forbidden' | 'reason_required' } {
  if (actorKind !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  if (reason.trim().length === 0) {
    return { ok: false, reason: 'reason_required' };
  }
  return { ok: true, review: { ...review, hidden: true } };
}

export function aggregateRatings(reviews: readonly ReviewRecord[]): {
  count: number;
  average: number | null;
} {
  const visible = reviews.filter((review) => !review.hidden);
  if (visible.length === 0) {
    return { count: 0, average: null };
  }
  const total = visible.reduce((sum, review) => sum + review.rating, 0);
  return { count: visible.length, average: Math.round((total / visible.length) * 100) / 100 };
}

function blankToNull(value: string | null): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}
