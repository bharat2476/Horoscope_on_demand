import { getFestivalDay } from '@/modules/festivals';
import { listGujaratMatajiTemples, listMatajiTemples } from '@/modules/temples';
import { listReviewedRituals } from '@/modules/rituals';

import { moderateSubmission, publicPhotoPaths } from '@/modules/content/moderation';
import {
  directionsUrl,
  isVerified,
  observancesFor,
  projectPublishedRituals,
  projectPublishedTemples,
} from '@/modules/content/publish';
import { SAMPLE_RITUAL_DRAFT } from '@/modules/content/sample-record';
import {
  type Actor,
  type FestivalDocument,
  type RitualDocument,
  type TempleDocument,
} from '@/modules/content/types';
import { issuesForPublication } from '@/modules/content/validate';
import { applyAction, createDraft } from '@/modules/content/workflow';

const editor: Actor = { id: 'editor-1', permissions: ['create', 'revise', 'submit'] };
const reviewer: Actor = {
  id: 'reviewer-1',
  permissions: ['approve', 'reject', 'publish', 'retire'],
};
const reader: Actor = { id: 'reader-1', permissions: [] };
const at = '2026-10-14T09:00:00Z';

function ritualBody(patch: Partial<Omit<RitualDocument, 'kind' | 'review'>> = {}) {
  return {
    id: 'fixture-ritual',
    title: { en: 'Fixture observance' },
    category: 'home' as const,
    language: 'en' as const,
    observance: 'Fixture observance details.',
    tradition: 'Fixture tradition',
    regionId: 'gj' as const,
    materials: ['Fixture material'],
    preparation: ['Fixture preparation'],
    steps: [{ order: 1, text: 'Fixture step' }],
    mantras: [],
    sources: [
      {
        id: 'fixture-source',
        kind: 'regional-custom' as const,
        title: 'Fixture source title',
        citation: 'Fixture citation, not a scripture reference.',
        reuse: 'short-citation-only' as const,
        notes: null,
      },
    ],
    ...patch,
  };
}

function festivalBody(
  id: string,
  regionId: FestivalDocument['regionId'],
  calendarDate: string | null,
): Omit<FestivalDocument, 'kind' | 'review'> {
  return {
    id,
    name: { en: 'Fixture observance', gu: 'Fixture observance' },
    language: 'en',
    regionId,
    observance: 'Fixture observance details.',
    calendarDate,
    convention: regionId
      ? `Stored ${regionId} date from an approved calendar.`
      : 'Stored date with no regional override.',
    sources: ritualBody().sources,
  };
}

function templeBody(
  patch: Partial<Omit<TempleDocument, 'kind' | 'review'>> = {},
): Omit<TempleDocument, 'kind' | 'review'> {
  return {
    id: 'fixture-temple',
    name: { en: 'Fixture Mataji', gu: 'Fixture Mataji' },
    deity: 'Mataji',
    address: null,
    stateId: 'gj',
    cityId: 'gj-ahmedabad',
    latitude: null,
    longitude: null,
    history: null,
    timings: null,
    aarti: null,
    festivalIds: [],
    descriptions: { en: 'Fixture description.' },
    language: 'en',
    sources: ritualBody().sources,
    lastVerifiedOn: '2026-10-01',
    submissions: [],
    ...patch,
  };
}

function publishFixture(body: Omit<RitualDocument, 'kind' | 'review'>): RitualDocument {
  const draft = createDraft({ kind: 'ritual', actor: editor, at, body });
  if (!draft.ok) {
    throw new Error(draft.issues.map((issue) => issue.code).join(','));
  }
  const submitted = applyAction(draft.document, 'submit', editor, at);
  if (!submitted.ok) {
    throw new Error(submitted.issues.map((issue) => issue.code).join(','));
  }
  const approved = applyAction(submitted.document, 'approve', reviewer, at);
  if (!approved.ok) {
    throw new Error(approved.issues.map((issue) => issue.code).join(','));
  }
  const published = applyAction(approved.document, 'publish', reviewer, at);
  if (!published.ok || published.document.kind !== 'ritual') {
    throw new Error(published.ok ? 'kind' : published.issues.map((issue) => issue.code).join(','));
  }
  return published.document;
}

describe('content review', () => {
  it('keeps the sample draft unverified and blocks publication', () => {
    expect(isVerified(SAMPLE_RITUAL_DRAFT)).toBe(false);
    expect(projectPublishedRituals([SAMPLE_RITUAL_DRAFT])).toEqual([]);
    expect(issuesForPublication(SAMPLE_RITUAL_DRAFT).map((issue) => issue.code)).toContain(
      'uncleared-source',
    );
    expect(applyAction(SAMPLE_RITUAL_DRAFT, 'publish', reviewer, at).ok).toBe(false);
  });

  it('refuses a public account and an author who tries to approve their own draft', () => {
    const draft = createDraft({ kind: 'ritual', actor: editor, at, body: ritualBody() });
    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      return;
    }
    expect(createDraft({ kind: 'ritual', actor: reader, at, body: ritualBody() }).ok).toBe(false);
    const submitted = applyAction(draft.document, 'submit', editor, at);
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) {
      return;
    }
    const author: Actor = { id: editor.id, permissions: ['approve', 'publish'] };
    const selfApproval = applyAction(submitted.document, 'approve', author, at);
    expect(selfApproval.ok).toBe(false);
    if (!selfApproval.ok) {
      expect(selfApproval.issues.map((issue) => issue.code)).toContain('self-approval');
    }
    expect(applyAction(submitted.document, 'publish', reader, at).ok).toBe(false);
    expect(isVerified(submitted.document)).toBe(false);
  });

  it('publishes only after a different reviewer approves a cleared source', () => {
    const published = publishFixture(ritualBody());
    expect(published.review.status).toBe('published');
    expect(published.review.history.map((entry) => entry.action)).toEqual([
      'create',
      'submit',
      'approve',
      'publish',
    ]);
    expect(projectPublishedRituals([published])).toHaveLength(1);
    expect(listReviewedRituals()).toEqual([]);
  });

  it('rejects a promise of protection and a scripture name without a citation', () => {
    const promised = createDraft({
      kind: 'ritual',
      actor: editor,
      at,
      body: ritualBody({ observance: 'This observance guarantees protection.' }),
    });
    expect(promised.ok).toBe(false);

    const named = createDraft({
      kind: 'ritual',
      actor: editor,
      at,
      body: ritualBody({ observance: 'Read the Bhagavad Gita during this step.' }),
    });
    expect(named.ok).toBe(true);
    if (!named.ok) {
      return;
    }
    const submitted = applyAction(named.document, 'submit', editor, at);
    expect(submitted.ok).toBe(false);
    if (submitted.ok) {
      return;
    }
    expect(submitted.issues.map((issue) => issue.code)).toContain('scripture-name-without-source');
  });

  it('retires a published record so it leaves the public list', () => {
    const published = publishFixture(ritualBody());
    const retired = applyAction(published, 'retire', reviewer, at, 'Superseded.');
    expect(retired.ok).toBe(true);
    if (!retired.ok) {
      return;
    }
    expect(projectPublishedRituals([retired.document])).toEqual([]);
  });
});

describe('festivals', () => {
  it('does not invent a date when two regions observe different stored dates', () => {
    const gujarat = mustFestival('fixture-gj', 'gj', '2026-10-20');
    const tamilNadu = mustFestival('fixture-tn', 'tn', '2026-11-01');
    const documents = [gujarat, tamilNadu];

    expect(
      observancesFor(documents, { calendarDate: '2026-10-20', regionId: 'gj' }).map(
        (item) => item.id,
      ),
    ).toEqual(['fixture-gj']);
    expect(observancesFor(documents, { calendarDate: '2026-10-20', regionId: 'tn' })).toEqual([]);
    expect(observancesFor(documents, { calendarDate: '2026-10-21', regionId: 'gj' })).toEqual([]);
    expect(getFestivalDay('2026-10-20')).toEqual({ status: 'unavailable' });
    expect(getFestivalDay('2026-10-20', { regionId: 'gj' }, documents).status).toBe('listed');
  });

  it('rejects a festival that has no stored date', () => {
    const draft = createDraft({
      kind: 'festival',
      actor: editor,
      at,
      body: festivalBody('fixture-undated', 'gj', null),
    });
    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      return;
    }
    expect(applyAction(draft.document, 'submit', editor, at).ok).toBe(false);
  });
});

describe('temples', () => {
  it('starts with an empty Gujarat Mataji directory', () => {
    expect(listMatajiTemples()).toEqual([]);
    expect(listGujaratMatajiTemples()).toEqual([]);
  });

  it('publishes a sourced fixture without timings and without a map link', () => {
    const published = mustTemple(templeBody());
    const listed = projectPublishedTemples([published], { deity: 'Mataji', stateId: 'gj' });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.directionsUrl).toBeNull();
    expect(listed[0]?.verification).toBe('verified');
    expect(projectPublishedTemples([published], { deity: 'Mataji', stateId: 'mh' })).toEqual([]);
  });

  it('requires a source before timings can be reviewed', () => {
    const draft = createDraft({
      kind: 'temple',
      actor: editor,
      at,
      body: templeBody({ timings: 'Fixture timing', sources: [] }),
    });
    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      return;
    }
    const submitted = applyAction(draft.document, 'submit', editor, at);
    expect(submitted.ok).toBe(false);
  });

  it('accepts a photo only with contributor permission and hides it until publication', () => {
    const draft = mustTemple(
      templeBody({
        submissions: [
          {
            id: 'fixture-photo',
            kind: 'photo',
            status: 'pending',
            submittedBy: 'contributor-1',
            permission: 'not-granted',
            storagePath: 'fixture/photo.jpg',
            note: 'Fixture photo.',
          },
        ],
      }),
    );
    expect(moderateSubmission(draft, 'fixture-photo', 'accepted', reviewer, null).ok).toBe(false);

    const permitted: TempleDocument = {
      ...draft,
      submissions: [{ ...draft.submissions[0], permission: 'contributor-granted' }],
    };
    const accepted = moderateSubmission(permitted, 'fixture-photo', 'accepted', reviewer, null);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) {
      return;
    }
    expect(
      publicPhotoPaths({
        ...accepted.document,
        review: { ...accepted.document.review, status: 'approved' },
      }),
    ).toEqual([]);
    expect(
      publicPhotoPaths({
        ...accepted.document,
        review: { ...accepted.document.review, status: 'published' },
      }),
    ).toEqual(['fixture/photo.jpg']);
  });

  it('builds a directions link only from coordinates', () => {
    expect(directionsUrl(null, null)).toBeNull();
    expect(directionsUrl(23.03, 72.58)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=23.03,72.58',
    );
  });
});

function mustFestival(
  id: string,
  regionId: FestivalDocument['regionId'],
  calendarDate: string,
): FestivalDocument {
  const draft = createDraft({
    kind: 'festival',
    actor: editor,
    at,
    body: festivalBody(id, regionId, calendarDate),
  });
  if (!draft.ok) {
    throw new Error(draft.issues.map((issue) => issue.code).join(','));
  }
  const submitted = applyAction(draft.document, 'submit', editor, at);
  if (!submitted.ok) {
    throw new Error(submitted.issues.map((issue) => issue.code).join(','));
  }
  const approved = applyAction(submitted.document, 'approve', reviewer, at);
  if (!approved.ok) {
    throw new Error(approved.issues.map((issue) => issue.code).join(','));
  }
  const published = applyAction(approved.document, 'publish', reviewer, at);
  if (!published.ok || published.document.kind !== 'festival') {
    throw new Error(published.ok ? 'kind' : published.issues.map((issue) => issue.code).join(','));
  }
  return published.document;
}

function mustTemple(body: Omit<TempleDocument, 'kind' | 'review'>): TempleDocument {
  const draft = createDraft({ kind: 'temple', actor: editor, at, body });
  if (!draft.ok) {
    throw new Error(draft.issues.map((issue) => issue.code).join(','));
  }
  const submitted = applyAction(draft.document, 'submit', editor, at);
  if (!submitted.ok) {
    throw new Error(submitted.issues.map((issue) => issue.code).join(','));
  }
  const approved = applyAction(submitted.document, 'approve', reviewer, at);
  if (!approved.ok) {
    throw new Error(approved.issues.map((issue) => issue.code).join(','));
  }
  const published = applyAction(approved.document, 'publish', reviewer, at);
  if (!published.ok || published.document.kind !== 'temple') {
    throw new Error(published.ok ? 'kind' : published.issues.map((issue) => issue.code).join(','));
  }
  return published.document;
}
