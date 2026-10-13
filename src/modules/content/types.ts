import { type AppLocale } from '@/modules/localization';
import { type StateId } from '@/modules/places';
import { type RitualCategory } from '@/modules/rituals/categories';

export const CONTENT_KINDS = ['ritual', 'festival', 'temple'] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

export const PUBLICATION_STATUSES = [
  'draft',
  'in-review',
  'approved',
  'rejected',
  'published',
  'retired',
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const CONTENT_PERMISSIONS = [
  'create',
  'revise',
  'submit',
  'approve',
  'reject',
  'publish',
  'retire',
] as const;

export type ContentPermission = (typeof CONTENT_PERMISSIONS)[number];

export const SOURCE_KINDS = [
  'scripture',
  'commentary',
  'scholarly-interpretation',
  'regional-custom',
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

/** How much of the cited work this record is allowed to contain. */
export const REUSE_RIGHTS = [
  'public-domain',
  'quoted-with-permission',
  'short-citation-only',
  'not-cleared',
] as const;

export type ReuseRight = (typeof REUSE_RIGHTS)[number];

export const CLEARED_REUSE: readonly ReuseRight[] = [
  'public-domain',
  'quoted-with-permission',
  'short-citation-only',
];

export type SourceReference = {
  id: string;
  kind: SourceKind;
  title: string;
  /** Editor-supplied locator. This module does not invent a chapter or verse. */
  citation: string;
  reuse: ReuseRight;
  notes: string | null;
};

export type Mantra = {
  originalScript: string;
  transliteration: string | null;
  explanation: string | null;
  sourceId: string;
};

export type RitualStep = {
  order: number;
  text: string;
};

export type RevisionEntry = {
  revision: number;
  at: string;
  actorId: string;
  action: 'create' | ContentPermission;
  note: string | null;
};

export type ReviewState = {
  status: PublicationStatus;
  createdBy: string;
  reviewerId: string | null;
  reviewDate: string | null;
  publishedAt: string | null;
  history: RevisionEntry[];
};

export type RitualDocument = {
  kind: 'ritual';
  id: string;
  title: Partial<Record<AppLocale, string>>;
  category: RitualCategory;
  language: AppLocale;
  observance: string;
  tradition: string | null;
  regionId: StateId | null;
  materials: string[];
  preparation: string[];
  steps: RitualStep[];
  mantras: Mantra[];
  sources: SourceReference[];
  review: ReviewState;
};

export type FestivalDocument = {
  kind: 'festival';
  id: string;
  name: Partial<Record<AppLocale, string>>;
  language: AppLocale;
  regionId: StateId | null;
  observance: string;
  /** Stored civil date from an approved calendar. Never calculated here. */
  calendarDate: string | null;
  convention: string;
  sources: SourceReference[];
  review: ReviewState;
};

export type CommunityPermission = 'contributor-granted' | 'not-granted';

export type SubmissionStatus = 'pending' | 'rejected' | 'accepted';

export type CommunitySubmission = {
  id: string;
  kind: 'photo' | 'correction';
  status: SubmissionStatus;
  submittedBy: string;
  permission: CommunityPermission;
  storagePath: string | null;
  note: string;
};

export type TempleDocument = {
  kind: 'temple';
  id: string;
  name: Partial<Record<AppLocale, string>>;
  deity: string;
  address: string | null;
  stateId: StateId | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  history: string | null;
  /** Null when no sourced timing has been entered. */
  timings: string | null;
  aarti: string | null;
  festivalIds: string[];
  descriptions: Partial<Record<AppLocale, string>>;
  language: AppLocale;
  sources: SourceReference[];
  lastVerifiedOn: string | null;
  submissions: CommunitySubmission[];
  review: ReviewState;
};

export type ContentDocument = RitualDocument | FestivalDocument | TempleDocument;

export type Actor = {
  id: string;
  permissions: readonly ContentPermission[];
};

export type ContentIssue = {
  code: string;
  message: string;
};

export type ContentResult<T> = { ok: true; document: T } | { ok: false; issues: ContentIssue[] };

/** Gujarat Mataji is the first directory scope. The schema accepts every state id. */
export const TEMPLE_DIRECTORY_SCOPE = {
  deity: 'Mataji',
  stateId: 'gj',
} as const;
