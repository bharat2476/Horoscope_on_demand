import { isAppLocale } from '@/modules/localization';
import { isStateId } from '@/modules/places';
import { RITUAL_CATEGORIES } from '@/modules/rituals/categories';

import { collectText, findForbiddenClaim, mentionsScripture } from '@/modules/content/claims';
import {
  CLEARED_REUSE,
  SOURCE_KINDS,
  type ContentDocument,
  type ContentIssue,
  type FestivalDocument,
  type RitualDocument,
  type SourceReference,
  type TempleDocument,
} from '@/modules/content/types';

const EDITORIAL_SKIP = new Set(['review', 'id', 'kind']);

export function issuesForReview(document: ContentDocument): ContentIssue[] {
  return [
    ...sharedIssues(document),
    ...sourceIssues(document.sources, false),
    ...kindIssues(document, false),
  ];
}

export function issuesForPublication(document: ContentDocument): ContentIssue[] {
  return [
    ...sharedIssues(document),
    ...sourceIssues(document.sources, true),
    ...kindIssues(document, true),
  ];
}

function sharedIssues(document: ContentDocument): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const text = collectText(document, EDITORIAL_SKIP).join('\n');
  const claim = findForbiddenClaim(text);
  if (claim) {
    issues.push({
      code: 'forbidden-claim',
      message: 'The text promises protection, health, or financial success.',
    });
  }
  if (
    mentionsScripture(text) &&
    !document.sources.some(
      (source) =>
        (source.kind === 'scripture' || source.kind === 'commentary') &&
        source.citation.trim().length > 0,
    )
  ) {
    issues.push({
      code: 'scripture-name-without-source',
      message: 'A scripture name is present without a scripture or commentary citation.',
    });
  }
  if (!isAppLocale(document.language)) {
    issues.push({ code: 'invalid-language', message: 'Language is not one of the app locales.' });
  }
  return issues;
}

function sourceIssues(sources: readonly SourceReference[], publishing: boolean): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (sources.length === 0) {
    issues.push({ code: 'missing-source', message: 'At least one source reference is required.' });
  }
  for (const source of sources) {
    if (!(SOURCE_KINDS as readonly string[]).includes(source.kind)) {
      issues.push({ code: 'invalid-source-kind', message: 'Source kind is not recognized.' });
    }
    if (source.title.trim().length === 0 || source.citation.trim().length === 0) {
      issues.push({
        code: 'missing-citation',
        message: 'Each source needs a title and a citation supplied by the editor.',
      });
    }
    if (
      (source.kind === 'scripture' ||
        source.kind === 'commentary' ||
        source.kind === 'scholarly-interpretation') &&
      source.reuse === 'not-cleared'
    ) {
      issues.push({
        code: 'uncleared-source',
        message: 'Scripture, commentary, and scholarly sources must have cleared reuse rights.',
      });
    }
    if (publishing && !CLEARED_REUSE.includes(source.reuse)) {
      issues.push({
        code: 'uncleared-source',
        message: 'Publication requires public-domain, permission, or citation-only reuse.',
      });
    }
  }
  return issues;
}

function kindIssues(document: ContentDocument, publishing: boolean): ContentIssue[] {
  if (document.kind === 'ritual') {
    return ritualIssues(document, publishing);
  }
  if (document.kind === 'festival') {
    return festivalIssues(document);
  }
  return templeIssues(document, publishing);
}

function ritualIssues(document: RitualDocument, publishing: boolean): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!hasText(document.title)) {
    issues.push({ code: 'missing-title', message: 'A ritual title is required.' });
  }
  if (document.observance.trim().length === 0) {
    issues.push({ code: 'missing-observance', message: 'The intended observance is required.' });
  }
  if (!(RITUAL_CATEGORIES as readonly string[]).includes(document.category)) {
    issues.push({ code: 'invalid-category', message: 'Ritual category is not recognized.' });
  }
  if (document.steps.length === 0 || document.steps.some((step) => step.text.trim().length === 0)) {
    issues.push({ code: 'missing-steps', message: 'Step-by-step instructions are required.' });
  }
  if (
    document.sources.some((source) => source.kind === 'regional-custom') &&
    document.tradition === null &&
    document.regionId === null
  ) {
    issues.push({
      code: 'missing-region',
      message: 'A regional custom needs a tradition name or a region.',
    });
  }
  if (document.regionId !== null && !isStateId(document.regionId)) {
    issues.push({ code: 'invalid-region', message: 'Region is not a known state id.' });
  }
  for (const mantra of document.mantras) {
    if (mantra.originalScript.trim().length === 0) {
      issues.push({ code: 'empty-mantra', message: 'A mantra needs its original script.' });
    }
    const source = document.sources.find((item) => item.id === mantra.sourceId);
    if (!source || (publishing && !CLEARED_REUSE.includes(source.reuse))) {
      issues.push({
        code: 'mantra-without-source',
        message: 'A mantra needs a cleared source. The text is not invented here.',
      });
    }
  }
  return issues;
}

function festivalIssues(document: FestivalDocument): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!hasText(document.name)) {
    issues.push({ code: 'missing-title', message: 'A festival name is required.' });
  }
  if (document.observance.trim().length === 0) {
    issues.push({ code: 'missing-observance', message: 'Observance details are required.' });
  }
  if (document.convention.trim().length === 0) {
    issues.push({
      code: 'missing-convention',
      message: 'A documented regional or calendar convention is required.',
    });
  }
  if (!isIsoDate(document.calendarDate)) {
    issues.push({
      code: 'missing-date',
      message: 'A festival date must be stored as YYYY-MM-DD. This module does not guess one.',
    });
  }
  if (document.regionId !== null && !isStateId(document.regionId)) {
    issues.push({ code: 'invalid-region', message: 'Region is not a known state id.' });
  }
  return issues;
}

function templeIssues(document: TempleDocument, publishing: boolean): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (!hasText(document.name)) {
    issues.push({ code: 'missing-title', message: 'A temple name is required.' });
  }
  if (document.deity.trim().length === 0) {
    issues.push({ code: 'missing-deity', message: 'A deity name is required.' });
  }
  if (!isStateId(document.stateId)) {
    issues.push({
      code: 'invalid-region',
      message: 'A temple needs a state id so the directory can grow.',
    });
  }
  const coordinates = coordinateIssue(document.latitude, document.longitude);
  if (coordinates) {
    issues.push(coordinates);
  }
  for (const field of [
    document.timings,
    document.aarti,
    document.history,
    document.address,
  ] as const) {
    if (field !== null && field.trim().length > 0 && document.sources.length === 0) {
      issues.push({
        code: 'unsourced-fact',
        message:
          'Timings, aarti, history, and address need a source. Leave them empty when unknown.',
      });
      break;
    }
  }
  if (publishing && !isIsoDate(document.lastVerifiedOn)) {
    issues.push({
      code: 'missing-verification-date',
      message: 'Publication requires the date an editor last verified the record.',
    });
  }
  return issues;
}

function coordinateIssue(latitude: number | null, longitude: number | null): ContentIssue | null {
  if (latitude === null && longitude === null) {
    return null;
  }
  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      code: 'invalid-coordinates',
      message: 'Latitude and longitude must both be present and inside their ranges.',
    };
  }
  return null;
}

function hasText(values: Partial<Record<string, string>>): boolean {
  return Object.values(values).some((value) => value?.trim());
}

export function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}
