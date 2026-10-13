import { type Actor, type ContentResult, type TempleDocument } from '@/modules/content/types';

/**
 * Community photos and corrections stay pending until an authorized reviewer accepts them.
 * Acceptance does not publish the temple and does not mark the submission as verified content.
 */
export function moderateSubmission(
  temple: TempleDocument,
  submissionId: string,
  decision: 'accepted' | 'rejected',
  actor: Actor,
  note: string | null,
): ContentResult<TempleDocument> {
  if (!actor.permissions.includes('approve') && !actor.permissions.includes('reject')) {
    return {
      ok: false,
      issues: [
        {
          code: 'missing-permission',
          message: 'A community submission can be moderated only by an authorized reviewer.',
        },
      ],
    };
  }
  if (decision === 'accepted' && !actor.permissions.includes('approve')) {
    return {
      ok: false,
      issues: [
        {
          code: 'missing-permission',
          message: 'Accepting a submission requires approve permission.',
        },
      ],
    };
  }
  if (decision === 'rejected' && !actor.permissions.includes('reject')) {
    return {
      ok: false,
      issues: [
        {
          code: 'missing-permission',
          message: 'Rejecting a submission requires reject permission.',
        },
      ],
    };
  }
  const submission = temple.submissions.find((item) => item.id === submissionId);
  if (!submission || submission.status !== 'pending') {
    return {
      ok: false,
      issues: [
        { code: 'missing-submission', message: 'There is no pending submission with that id.' },
      ],
    };
  }
  if (
    decision === 'accepted' &&
    submission.kind === 'photo' &&
    submission.permission !== 'contributor-granted'
  ) {
    return {
      ok: false,
      issues: [
        {
          code: 'permission-not-granted',
          message:
            'A photo can be accepted only when the contributor granted permission to use it.',
        },
      ],
    };
  }
  if (decision === 'accepted' && submission.kind === 'photo' && !submission.storagePath) {
    return {
      ok: false,
      issues: [{ code: 'missing-photo', message: 'An accepted photo needs a stored file.' }],
    };
  }
  if (decision === 'rejected' && (!note || note.trim().length === 0)) {
    return {
      ok: false,
      issues: [
        { code: 'rejection-note-required', message: 'Rejecting a submission needs a note.' },
      ],
    };
  }
  return {
    ok: true,
    document: {
      ...temple,
      submissions: temple.submissions.map((item) =>
        item.id === submissionId ? { ...item, status: decision } : item,
      ),
    },
  };
}

export function publicPhotoPaths(temple: TempleDocument): string[] {
  if (temple.review.status !== 'published') {
    return [];
  }
  return temple.submissions.flatMap((submission) =>
    submission.kind === 'photo' &&
    submission.status === 'accepted' &&
    submission.permission === 'contributor-granted' &&
    submission.storagePath
      ? [submission.storagePath]
      : [],
  );
}
