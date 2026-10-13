import { issuesForPublication, issuesForReview } from '@/modules/content/validate';
import {
  type Actor,
  type ContentDocument,
  type ContentIssue,
  type ContentPermission,
  type ContentResult,
  type FestivalDocument,
  type ReviewState,
  type RitualDocument,
  type TempleDocument,
} from '@/modules/content/types';

type DraftInput = {
  actor: Actor;
  at: string;
} & (
  | { kind: 'ritual'; body: Omit<RitualDocument, 'kind' | 'review'> }
  | { kind: 'festival'; body: Omit<FestivalDocument, 'kind' | 'review'> }
  | { kind: 'temple'; body: Omit<TempleDocument, 'kind' | 'review'> }
);

export function createDraft(input: DraftInput): ContentResult<ContentDocument> {
  const permission = requirePermission(input.actor, 'create');
  if (permission) {
    return { ok: false, issues: [permission] };
  }
  const review: ReviewState = {
    status: 'draft',
    createdBy: input.actor.id,
    reviewerId: null,
    reviewDate: null,
    publishedAt: null,
    history: [{ revision: 1, at: input.at, actorId: input.actor.id, action: 'create', note: null }],
  };
  const document = { ...input.body, kind: input.kind, review } as ContentDocument;
  const claim = issuesForReview(document).find((issue) => issue.code === 'forbidden-claim');
  if (claim) {
    return { ok: false, issues: [claim] };
  }
  return { ok: true, document };
}

export function applyAction(
  document: ContentDocument,
  action: Exclude<ContentPermission, 'create'>,
  actor: Actor,
  at: string,
  note: string | null = null,
  replacement?: ContentDocument,
): ContentResult<ContentDocument> {
  const permission = requirePermission(actor, action);
  if (permission) {
    return { ok: false, issues: [permission] };
  }
  if (action === 'revise') {
    return revise(document, actor, at, note, replacement);
  }
  if (action === 'submit') {
    return move(
      document,
      actor,
      at,
      note,
      'submit',
      'draft',
      'in-review',
      issuesForReview(document),
    );
  }
  if (action === 'approve') {
    if (actor.id === document.review.createdBy) {
      return {
        ok: false,
        issues: [
          {
            code: 'self-approval',
            message: 'The author cannot approve their own draft into verified content.',
          },
        ],
      };
    }
    const next = move(
      document,
      actor,
      at,
      note,
      'approve',
      'in-review',
      'approved',
      issuesForReview(document),
    );
    if (!next.ok) {
      return next;
    }
    return {
      ok: true,
      document: withReview(next.document, {
        reviewerId: actor.id,
        reviewDate: at.slice(0, 10),
      }),
    };
  }
  if (action === 'reject') {
    if (!note || note.trim().length === 0) {
      return {
        ok: false,
        issues: [
          { code: 'rejection-note-required', message: 'A rejection needs a note for the editor.' },
        ],
      };
    }
    return move(document, actor, at, note, 'reject', 'in-review', 'rejected', []);
  }
  if (action === 'publish') {
    const approvedBySomeoneElse = document.review.history.some(
      (entry) => entry.action === 'approve' && entry.actorId !== document.review.createdBy,
    );
    if (!approvedBySomeoneElse || document.review.reviewerId === null) {
      return {
        ok: false,
        issues: [
          {
            code: 'approval-required',
            message: 'Only an approved record can be published as verified.',
          },
        ],
      };
    }
    const next = move(
      document,
      actor,
      at,
      note,
      'publish',
      'approved',
      'published',
      issuesForPublication(document),
    );
    if (!next.ok) {
      return next;
    }
    return { ok: true, document: withReview(next.document, { publishedAt: at }) };
  }
  return move(document, actor, at, note, 'retire', 'published', 'retired', []);
}

function revise(
  document: ContentDocument,
  actor: Actor,
  at: string,
  note: string | null,
  replacement: ContentDocument | undefined,
): ContentResult<ContentDocument> {
  if (document.review.status !== 'draft' && document.review.status !== 'rejected') {
    return { ok: false, issues: [transitionIssue(document.review.status, 'revise')] };
  }
  if (!replacement || replacement.id !== document.id || replacement.kind !== document.kind) {
    return {
      ok: false,
      issues: [{ code: 'missing-revision', message: 'A revision needs the replacement document.' }],
    };
  }
  const next = {
    ...replacement,
    review: appendHistory(
      {
        ...document.review,
        status: 'draft',
        reviewerId: null,
        reviewDate: null,
        publishedAt: null,
      },
      actor,
      at,
      'revise',
      note,
    ),
  } as ContentDocument;
  const claim = issuesForReview(next).find((issue) => issue.code === 'forbidden-claim');
  if (claim) {
    return { ok: false, issues: [claim] };
  }
  return { ok: true, document: next };
}

function move(
  document: ContentDocument,
  actor: Actor,
  at: string,
  note: string | null,
  action: ReviewState['history'][number]['action'],
  from: ContentDocument['review']['status'],
  to: ContentDocument['review']['status'],
  issues: ContentIssue[],
): ContentResult<ContentDocument> {
  if (document.review.status !== from) {
    return { ok: false, issues: [transitionIssue(document.review.status, action)] };
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    document: withReview(document, {
      status: to,
      history: appendHistory(document.review, actor, at, action, note).history,
    }),
  };
}

function withReview(document: ContentDocument, patch: Partial<ReviewState>): ContentDocument {
  return { ...document, review: { ...document.review, ...patch } } as ContentDocument;
}

function appendHistory(
  review: ReviewState,
  actor: Actor,
  at: string,
  action: ReviewState['history'][number]['action'],
  note: string | null,
): ReviewState {
  return {
    ...review,
    history: [
      ...review.history,
      { revision: review.history.length + 1, at, actorId: actor.id, action, note },
    ],
  };
}

function requirePermission(actor: Actor, permission: ContentPermission): ContentIssue | null {
  if (actor.permissions.includes(permission)) {
    return null;
  }
  return {
    code: 'missing-permission',
    message: `The account does not have permission to ${permission}.`,
  };
}

function transitionIssue(status: string, action: string): ContentIssue {
  return {
    code: 'invalid-transition',
    message: `${action} is not available while the record is ${status}.`,
  };
}
