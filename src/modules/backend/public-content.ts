import { type PublicQuery } from '@/modules/backend/query';
import { isIsoDate } from '@/modules/content';
import { type PublishedFestival } from '@/modules/festivals';
import { isRashiId, type RashiId } from '@/modules/horoscope';
import { type DailyReading, type ReadingSource, type SourceType } from '@/modules/horoscope/daily';
import { isAppLocale, type AppLocale } from '@/modules/localization';
import { isStateId } from '@/modules/places';
import { type RitualCategory } from '@/modules/rituals/categories';
import { type RitualRecord } from '@/modules/rituals';
import { type TempleRecord } from '@/modules/temples';

const BIRTH_KEYS = [
  'birthDate',
  'birthTime',
  'birthPlace',
  'birthplace',
  'birth_date',
  'birth_time',
  'birth_place',
];

const SOURCE_TYPES = new Set<SourceType>([
  'scripture',
  'classical-jyotish',
  'regional-custom',
  'editorial',
  'financial-education',
]);

const CATEGORIES = new Set<RitualCategory>(['daily', 'vrata', 'festival', 'home']);

function hasBirthDetail(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return BIRTH_KEYS.some((key) => key in record);
}

function localeMap(value: unknown): Partial<Record<AppLocale, string>> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const result: Partial<Record<AppLocale, string>> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isAppLocale(key) && typeof entry === 'string' && entry.trim().length > 0) {
      result[key] = entry.trim();
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function titleInLanguage(
  title: Partial<Record<AppLocale, string>>,
  locale: AppLocale,
): string | null {
  const value = title[locale]?.trim();
  return value ? value : null;
}

/** Fixture and remote rows are shown in the requested language only. */
export function parsePublishedRitual(row: Record<string, unknown>): RitualRecord | null {
  if (typeof row.id !== 'string' || hasBirthDetail(row.body)) {
    return null;
  }
  const body = row.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.kind !== undefined && record.kind !== 'ritual') {
    return null;
  }
  if (!CATEGORIES.has(record.category as RitualCategory)) {
    return null;
  }
  const title = localeMap(record.title);
  if (!title) {
    return null;
  }
  return {
    id: row.id,
    category: record.category as RitualCategory,
    title,
    steps: null,
  };
}

export function parsePublishedTemple(row: Record<string, unknown>): TempleRecord | null {
  if (typeof row.id !== 'string' || hasBirthDetail(row.body)) {
    return null;
  }
  const body = row.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.deity !== 'Mataji' || typeof record.stateId !== 'string') {
    return null;
  }
  const name = localeMap(record.name);
  if (!name) {
    return null;
  }
  const locality = localeMap(record.descriptions) ?? {};
  return {
    id: row.id,
    name,
    locality,
    stateId: record.stateId,
    cityId: typeof record.cityId === 'string' ? record.cityId : null,
    directionsUrl: null,
    verification: 'verified',
    lastVerifiedOn: typeof record.lastVerifiedOn === 'string' ? record.lastVerifiedOn : undefined,
  };
}

function text(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function parseNote(
  value: unknown,
  sourceIds: ReadonlySet<string>,
): { text: string; sourceId: string } | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.text !== 'string' || typeof record.sourceId !== 'string') {
    return null;
  }
  if (!record.text.trim() || !sourceIds.has(record.sourceId)) {
    return null;
  }
  return { text: record.text.trim(), sourceId: record.sourceId };
}

function parseObservance(
  value: unknown,
  sourceIds: ReadonlySet<string>,
): DailyReading['observance'] {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.originalScript !== 'string' ||
    typeof record.meaning !== 'string' ||
    typeof record.sourceId !== 'string' ||
    !record.originalScript.trim() ||
    !record.meaning.trim() ||
    !sourceIds.has(record.sourceId)
  ) {
    return null;
  }
  return {
    originalScript: record.originalScript.trim(),
    transliteration: typeof record.transliteration === 'string' ? record.transliteration : '',
    meaning: record.meaning.trim(),
    sourceId: record.sourceId,
  };
}

function parseSource(value: unknown): ReadingSource | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const type = record.type;
  if (
    typeof record.id !== 'string' ||
    typeof record.title !== 'string' ||
    !SOURCE_TYPES.has(type as SourceType)
  ) {
    return null;
  }
  return {
    id: record.id,
    type: type as SourceType,
    title: record.title,
    citation: typeof record.citation === 'string' ? record.citation : null,
    tradition: typeof record.tradition === 'string' ? record.tradition : null,
    translator: typeof record.translator === 'string' ? record.translator : null,
    edition: typeof record.edition === 'string' ? record.edition : null,
  };
}

/**
 * Builds a display reading from a published view row.
 * Incomplete sections are rejected instead of being filled in.
 */
export function parsePublishedDailyRow(row: Record<string, unknown>): DailyReading | null {
  if (hasBirthDetail(row.body) || hasBirthDetail(row)) {
    return null;
  }
  const body = row.body;
  if (
    typeof row.id !== 'string' ||
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body)
  ) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const language = row.language;
  const rashiId = row.rashi_id;
  const date = typeof row.civil_date === 'string' ? row.civil_date.slice(0, 10) : null;
  const version = row.version;
  const tradition = text(row, 'tradition');
  const outlook = text(record, 'outlook');
  const family = text(record, 'family');
  const career = text(record, 'career');
  const finance = text(record, 'finance');
  const financeEducation = text(record, 'financeEducation');
  const action = text(record, 'action');
  if (
    !isAppLocale(language) ||
    !isRashiId(rashiId) ||
    !date ||
    typeof version !== 'number' ||
    !tradition ||
    !outlook ||
    !family ||
    !career ||
    !finance ||
    !financeEducation ||
    !action
  ) {
    return null;
  }
  const sources = Array.isArray(row.sources)
    ? row.sources.map(parseSource).filter((source): source is ReadingSource => source !== null)
    : [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const color = parseNote(record.color, sourceIds);
  const seva = parseNote(record.seva, sourceIds);
  const observance = parseObservance(record.observance, sourceIds);
  return {
    id: row.id,
    canonicalId: typeof row.canonical_id === 'string' ? row.canonical_id : null,
    date,
    rashiId,
    language,
    version,
    tradition,
    outlook,
    family,
    career,
    finance,
    financeEducation,
    color,
    observance,
    seva,
    action,
    sources,
    assistance: 'none',
    status: 'published',
    createdBy: row.id,
    reviewerId: null,
    reviewDate: null,
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    developmentExample: false,
  };
}

export function selectLanguageEdition<T extends { language: string }>(
  rows: readonly T[],
  language: string,
): { status: 'ready'; row: T } | { status: 'missing-translation' } | { status: 'missing' } {
  const match = rows.find((row) => row.language === language);
  if (match) {
    return { status: 'ready', row: match };
  }
  if (rows.length > 0) {
    return { status: 'missing-translation' };
  }
  return { status: 'missing' };
}

/**
 * Reads one published-festivals view row.
 * Reviewer ids, review dates, and editorial notes are left off the result.
 */
export function parsePublishedFestival(row: Record<string, unknown>): PublishedFestival | null {
  if (typeof row.id !== 'string' || hasBirthDetail(row) || hasBirthDetail(row.body)) {
    return null;
  }
  const body = row.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.kind !== undefined && record.kind !== 'festival') {
    return null;
  }
  const name = localeMap(record.name);
  const observance = text(record, 'observance');
  const convention = text(record, 'convention');
  const calendarDate = text(record, 'calendarDate');
  const language = record.language;
  if (!name || !observance || !convention || !calendarDate || !isIsoDate(calendarDate)) {
    return null;
  }
  if (!isAppLocale(language)) {
    return null;
  }
  if (record.regionId !== null && record.regionId !== undefined && !isStateId(record.regionId)) {
    return null;
  }
  return {
    id: row.id,
    name,
    language,
    regionId: isStateId(record.regionId) ? record.regionId : null,
    observance,
    calendarDate,
    convention,
  };
}

async function readRows(
  query: PublicQuery,
  view:
    | 'published_rituals'
    | 'published_temples'
    | 'published_festivals'
    | 'published_daily_rashis'
    | 'panchang_cache_public',
  filters?: Readonly<Record<string, string>>,
): Promise<{ ok: true; rows: readonly Record<string, unknown>[] } | { ok: false }> {
  const result = await query.read(view, filters);
  if (result.error || !result.data) {
    return { ok: false };
  }
  return { ok: true, rows: result.data };
}

export async function loadPublishedRituals(
  query: PublicQuery,
): Promise<{ status: 'ready'; value: RitualRecord[] } | { status: 'empty' } | { status: 'error' }> {
  const result = await readRows(query, 'published_rituals');
  if (!result.ok) {
    return { status: 'error' };
  }
  const value = result.rows
    .map(parsePublishedRitual)
    .filter((item): item is RitualRecord => item !== null);
  return value.length > 0 ? { status: 'ready', value } : { status: 'empty' };
}

export async function loadPublishedFestivals(
  query: PublicQuery,
): Promise<
  { status: 'ready'; value: PublishedFestival[] } | { status: 'empty' } | { status: 'error' }
> {
  const result = await readRows(query, 'published_festivals');
  if (!result.ok) {
    return { status: 'error' };
  }
  const value = result.rows
    .map(parsePublishedFestival)
    .filter((item): item is PublishedFestival => item !== null);
  return value.length > 0 ? { status: 'ready', value } : { status: 'empty' };
}

export async function loadPublishedTemples(
  query: PublicQuery,
): Promise<{ status: 'ready'; value: TempleRecord[] } | { status: 'empty' } | { status: 'error' }> {
  const result = await readRows(query, 'published_temples');
  if (!result.ok) {
    return { status: 'error' };
  }
  const value = result.rows
    .map(parsePublishedTemple)
    .filter((item): item is TempleRecord => item !== null);
  return value.length > 0 ? { status: 'ready', value } : { status: 'empty' };
}

export async function loadPublishedDaily(
  query: PublicQuery,
  input: { date: string; rashiId: RashiId },
): Promise<{ status: 'ready'; value: DailyReading[] } | { status: 'empty' } | { status: 'error' }> {
  const result = await readRows(query, 'published_daily_rashis', {
    civil_date: input.date,
    rashi_id: input.rashiId,
  });
  if (!result.ok) {
    return { status: 'error' };
  }
  const value = result.rows
    .map(parsePublishedDailyRow)
    .filter((item): item is DailyReading => item !== null);
  return value.length > 0 ? { status: 'ready', value } : { status: 'empty' };
}
