import { isAppLocale, type AppLocale } from '@/modules/localization';

import { RASHIS, isRashiId, type RashiId } from '@/modules/horoscope/rashis';

export const SOURCE_TYPES = [
  'scripture',
  'classical-jyotish',
  'regional-custom',
  'editorial',
  'financial-education',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const READING_STATUSES = [
  'draft',
  'in-review',
  'approved',
  'rejected',
  'published',
  'retired',
] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number];

export type ReadingSource = {
  id: string;
  type: SourceType;
  title: string;
  citation: string | null;
  tradition: string | null;
  translator: string | null;
  edition: string | null;
};

export type AttributedNote = {
  text: string;
  sourceId: string;
};

export type Observance = {
  originalScript: string;
  transliteration: string;
  meaning: string;
  sourceId: string;
};

export type DailyReading = {
  id: string;
  /** Null for the authored text. A translation points at that authored row. */
  canonicalId: string | null;
  date: string;
  rashiId: RashiId;
  language: AppLocale;
  version: number;
  tradition: string;
  outlook: string;
  family: string;
  career: string;
  finance: string;
  /** General money awareness, kept apart from the astrological reflection. */
  financeEducation: string;
  color: AttributedNote | null;
  observance: Observance | null;
  seva: AttributedNote | null;
  action: string;
  sources: readonly ReadingSource[];
  assistance: 'none' | 'ai-draft';
  status: ReadingStatus;
  createdBy: string;
  reviewerId: string | null;
  reviewDate: string | null;
  publishedAt: string | null;
  developmentExample: boolean;
};

export type ReadingIssue = { code: string; message: string };

const CLAIM =
  /guaranteed returns|stock pick|financial freedom|wealth is guaranteed|\bcurse\b|must donate|will reconcile|removes misfortune/i;

export function isCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function orderRashis(preferred: RashiId | null): RashiId[] {
  const ids = RASHIS.map((rashi) => rashi.id);
  if (!preferred) {
    return [...ids];
  }
  return [preferred, ...ids.filter((id) => id !== preferred)];
}

export function adjacentRashi(id: RashiId, direction: -1 | 1): RashiId {
  const ids = RASHIS.map((rashi) => rashi.id);
  const index = ids.indexOf(id);
  return ids[(index + direction + ids.length) % ids.length];
}

export function readingIssues(reading: DailyReading): ReadingIssue[] {
  const issues: ReadingIssue[] = [];
  if (!isCivilDate(reading.date)) {
    issues.push({ code: 'invalid-date', message: 'The civil date is not a real calendar day.' });
  }
  if (!isRashiId(reading.rashiId)) {
    issues.push({ code: 'invalid-rashi', message: 'Rashi is not one of the twelve.' });
  }
  if (!isAppLocale(reading.language)) {
    issues.push({ code: 'invalid-language', message: 'Language is not one of the ten catalogs.' });
  }
  if (!Number.isInteger(reading.version) || reading.version < 1) {
    issues.push({ code: 'invalid-version', message: 'Version must be a positive integer.' });
  }
  if (reading.tradition.trim().length === 0) {
    issues.push({ code: 'missing-tradition', message: 'A tradition label is required.' });
  }
  for (const [code, value] of [
    ['missing-outlook', reading.outlook],
    ['missing-family', reading.family],
    ['missing-career', reading.career],
    ['missing-finance', reading.finance],
    ['missing-finance-education', reading.financeEducation],
    ['missing-action', reading.action],
  ] as const) {
    if (value.trim().length === 0) {
      issues.push({ code, message: 'A required section is empty.' });
    }
  }
  const text = [
    reading.outlook,
    reading.family,
    reading.career,
    reading.finance,
    reading.financeEducation,
    reading.color?.text,
    reading.observance?.meaning,
    reading.seva?.text,
    reading.action,
  ]
    .filter((item): item is string => typeof item === 'string')
    .join('\n');
  if (CLAIM.test(text)) {
    issues.push({
      code: 'forbidden-claim',
      message: 'The text guarantees wealth, demands a donation, or uses a curse.',
    });
  }
  if (reading.sources.length === 0) {
    issues.push({ code: 'missing-source', message: 'At least one source is required.' });
  }
  for (const source of reading.sources) {
    if (!(SOURCE_TYPES as readonly string[]).includes(source.type)) {
      issues.push({ code: 'invalid-source-type', message: 'Source type is not recognized.' });
    }
    if (source.title.trim().length === 0) {
      issues.push({ code: 'missing-source-title', message: 'Each source needs a title.' });
    }
    if (source.type === 'scripture') {
      if (!source.citation || source.citation.trim().length === 0) {
        issues.push({ code: 'missing-citation', message: 'Scripture needs a precise reference.' });
      }
      if (!source.tradition || source.tradition.trim().length === 0) {
        issues.push({
          code: 'missing-source-tradition',
          message: 'Scripture needs a tradition label.',
        });
      }
      if (
        (!source.translator || source.translator.trim().length === 0) &&
        (!source.edition || source.edition.trim().length === 0)
      ) {
        issues.push({
          code: 'missing-edition',
          message: 'Scripture needs a translator or an edition.',
        });
      }
    }
  }
  for (const note of [reading.color, reading.seva]) {
    if (note && !reading.sources.some((source) => source.id === note.sourceId)) {
      issues.push({
        code: 'missing-note-source',
        message: 'A color or seva note needs its source.',
      });
    }
  }
  if (reading.observance) {
    const source = reading.sources.find((item) => item.id === reading.observance?.sourceId);
    if (!source) {
      issues.push({
        code: 'missing-observance-source',
        message: 'An observance needs its source.',
      });
    }
    if (
      reading.observance.originalScript.trim().length === 0 ||
      reading.observance.meaning.trim().length === 0
    ) {
      issues.push({
        code: 'incomplete-observance',
        message: 'An observance needs the original script and a meaning.',
      });
    }
  }
  if (reading.assistance === 'ai-draft' && reading.reviewerId === null) {
    issues.push({
      code: 'human-review-required',
      message: 'An assisted draft stays unpublished until a person reviews it.',
    });
  }
  return issues;
}

export function issuesForPublication(reading: DailyReading, actorId: string): ReadingIssue[] {
  const issues = readingIssues(reading);
  if (reading.developmentExample) {
    issues.push({
      code: 'development-example',
      message: 'A development example cannot be published as a horoscope.',
    });
  }
  if (reading.status !== 'approved') {
    issues.push({ code: 'not-approved', message: 'Publication requires an approved review.' });
  }
  if (
    actorId === reading.createdBy ||
    reading.reviewerId === null ||
    reading.reviewerId === reading.createdBy
  ) {
    issues.push({ code: 'self-approval', message: 'The author cannot approve their own reading.' });
  }
  if (!reading.reviewDate || !isCivilDate(reading.reviewDate)) {
    issues.push({ code: 'missing-review-date', message: 'A review date is required.' });
  }
  return issues;
}

export function publishDailyReading(
  reading: DailyReading,
  actorId: string,
  publishedAt: string,
): { ok: true; reading: DailyReading } | { ok: false; issues: ReadingIssue[] } {
  const issues = issuesForPublication(reading, actorId);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    reading: { ...reading, status: 'published', publishedAt, reviewerId: reading.reviewerId },
  };
}

export type PublishedReading = {
  status: 'published';
  reading: DailyReading;
};

export type ReadingLookup =
  | PublishedReading
  | { status: 'missing' }
  | { status: 'missing-translation' }
  | { status: 'invalid-date' };

/** Published rows only. Drafts, examples, and other people's edits are not returned. */
export function readPublishedReading(
  catalog: readonly DailyReading[],
  query: { date: string; rashiId: RashiId; locale: AppLocale },
): ReadingLookup {
  if (!isCivilDate(query.date)) {
    return { status: 'invalid-date' };
  }
  const published = catalog.filter(
    (reading) =>
      reading.status === 'published' &&
      !reading.developmentExample &&
      reading.date === query.date &&
      reading.rashiId === query.rashiId,
  );
  const inLanguage = published
    .filter((reading) => reading.language === query.locale)
    .sort((a, b) => b.version - a.version);
  if (inLanguage[0]) {
    return { status: 'published', reading: inLanguage[0] };
  }
  if (published.length > 0) {
    return { status: 'missing-translation' };
  }
  return { status: 'missing' };
}

export function visibleToAnonymous(catalog: readonly DailyReading[]): readonly DailyReading[] {
  return catalog.filter((reading) => reading.status === 'published' && !reading.developmentExample);
}

export function shareHoroscopeCard(input: {
  rashiLabel: string;
  dateLabel: string;
  lookup: ReadingLookup;
  missing: string;
  missingTranslation: string;
}): string {
  if (input.lookup.status === 'published') {
    const source = input.lookup.reading.sources[0];
    return [
      input.rashiLabel,
      input.dateLabel,
      input.lookup.reading.action,
      source ? `${source.type}: ${source.title}` : '',
    ]
      .filter((line) => line.length > 0)
      .join('\n');
  }
  if (input.lookup.status === 'missing-translation') {
    return `${input.rashiLabel}\n${input.dateLabel}\n${input.missingTranslation}`;
  }
  return `${input.rashiLabel}\n${input.dateLabel}\n${input.missing}`;
}

/** Empty on purpose. A reviewed editor publishes rows. This list is not a prediction. */
export const PUBLISHED_DAILY_READINGS: readonly DailyReading[] = [];

const exampleSource: ReadingSource = {
  id: 'example-source',
  type: 'editorial',
  title: 'Development fixture',
  citation: null,
  tradition: 'Development example',
  translator: null,
  edition: null,
};

/** Labeled fixture for tests. It is not a horoscope and cannot be published. */
export const DEVELOPMENT_DAILY_EXAMPLE: DailyReading = {
  id: 'dev-example-mesha',
  canonicalId: null,
  date: '2026-10-15',
  rashiId: 'mesha',
  language: 'en',
  version: 1,
  tradition: 'Development example',
  outlook: 'Development example. No prediction is stated.',
  family: 'Development example. No prediction is stated.',
  career: 'Development example. No prediction is stated.',
  finance: 'Development example. No prediction is stated.',
  financeEducation: 'Development example. No financial instruction is stated.',
  color: null,
  observance: null,
  seva: null,
  action: 'Development example. No action is prescribed.',
  sources: [exampleSource],
  assistance: 'none',
  status: 'draft',
  createdBy: 'editor-example',
  reviewerId: null,
  reviewDate: null,
  publishedAt: null,
  developmentExample: true,
};
