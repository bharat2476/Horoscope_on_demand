import { type ValidatedPanchang } from '@/modules/dashboard/load';

const BIRTH_KEYS = [
  'birthDate',
  'birthTime',
  'birthPlace',
  'birthplace',
  'birth_date',
  'birth_time',
  'birth_place',
] as const;

export type PanchangPresentation =
  | { status: 'unavailable' }
  | { status: 'current'; value: ValidatedPanchang; retrievedAt: string }
  | { status: 'stale'; value: ValidatedPanchang; retrievedAt: string };

function text(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/**
 * A cached payload is current only while the provider row says so and expiry is still ahead.
 * Expired rows stay visible as stale, with the retrieval time. Missing fields stay unavailable.
 */
export function presentCachedPanchang(
  row: Record<string, unknown> | null,
  now: Date,
): PanchangPresentation {
  if (!row) {
    return { status: 'unavailable' };
  }
  const payload = row.payload;
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { status: 'unavailable' };
  }
  const body = payload as Record<string, unknown>;
  if (BIRTH_KEYS.some((key) => key in body)) {
    return { status: 'unavailable' };
  }
  const tithi = text(body, 'tithi');
  const nakshatra = text(body, 'nakshatra');
  const sunrise = text(body, 'sunrise');
  const sunset = text(body, 'sunset');
  const retrievedAt = text(row, 'retrieved_at');
  const expiresAt = text(row, 'expires_at');
  if (!tithi || !nakshatra || !sunrise || !sunset || !retrievedAt || !expiresAt) {
    return { status: 'unavailable' };
  }
  const value: ValidatedPanchang = {
    status: 'ready',
    source: 'validated',
    tithi,
    nakshatra,
    sunrise,
    sunset,
  };
  const expiry = new Date(expiresAt).getTime();
  const stillCurrent =
    row.freshness === 'current' && !Number.isNaN(expiry) && expiry > now.getTime();
  return stillCurrent
    ? { status: 'current', value, retrievedAt }
    : { status: 'stale', value, retrievedAt };
}
