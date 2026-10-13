import {
  type CalculationConvention,
  type NamedInterval,
  type NormalizedPanchang,
  type PanchangOk,
  type PanchangOutcome,
  type PanchangQueryInput,
  type TimeInterval,
} from '@/modules/panchang/normalized';

export type ParseResult =
  { ok: true; record: NormalizedPanchang } | { ok: false; missing: string[] };

/** Accepts only the normalized envelope. A vendor payload that is not this shape is rejected. */
export function parseNormalizedPanchang(value: unknown): ParseResult {
  const missing: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, missing: ['record'] };
  }
  if (value.schemaVersion !== '1') {
    missing.push('schemaVersion');
  }
  const query = parseQuery(value.query, missing);
  const convention = parseConvention(value.convention, missing);
  const result = parseOutcome(value.result, missing);
  if (!query || !convention || !result || missing.length > 0) {
    return { ok: false, missing: [...new Set(missing)] };
  }
  return { ok: true, record: { schemaVersion: '1', query, convention, result } };
}

function parseQuery(value: unknown, missing: string[]): PanchangQueryInput | null {
  if (!isRecord(value)) {
    missing.push('query');
    return null;
  }
  const calendarDate = stringField(value, 'calendarDate', missing);
  const latitude = numberField(value, 'latitude', missing);
  const longitude = numberField(value, 'longitude', missing);
  const elevationMeters = nullableNumber(value, 'elevationMeters', missing);
  const timeZone = stringField(value, 'timeZone', missing);
  const instant = stringField(value, 'instant', missing);
  const ayanamsa = isRecord(value.ayanamsa) ? value.ayanamsa : null;
  if (!ayanamsa) {
    missing.push('query.ayanamsa');
  }
  const ayanamsaId = ayanamsa ? stringField(ayanamsa, 'id', missing, 'query.ayanamsa.id') : null;
  if (
    !calendarDate ||
    latitude === null ||
    longitude === null ||
    !timeZone ||
    !instant ||
    !ayanamsaId
  ) {
    return null;
  }
  return {
    calendarDate,
    latitude,
    longitude,
    elevationMeters,
    timeZone,
    instant,
    ayanamsa: {
      id: ayanamsaId as PanchangQueryInput['ayanamsa']['id'],
      providerCode:
        ayanamsa && 'providerCode' in ayanamsa
          ? (ayanamsa.providerCode as string | number | null)
          : null,
      arcseconds: ayanamsa ? nullableNumber(ayanamsa, 'arcseconds', missing) : null,
    },
    ...(typeof value.cityId === 'string' ? { cityId: value.cityId } : {}),
  };
}

function parseConvention(value: unknown, missing: string[]): CalculationConvention | null {
  if (!isRecord(value)) {
    missing.push('convention');
    return null;
  }
  const sunriseLimb = stringField(value, 'sunriseLimb', missing, 'convention.sunriseLimb');
  const refraction = stringField(value, 'refraction', missing, 'convention.refraction');
  const dayBoundary = stringField(value, 'dayBoundary', missing, 'convention.dayBoundary');
  const monthSystem = stringField(value, 'monthSystem', missing, 'convention.monthSystem');
  if (!sunriseLimb || !refraction || dayBoundary !== 'sunrise-to-next-sunrise' || !monthSystem) {
    if (dayBoundary !== 'sunrise-to-next-sunrise') {
      missing.push('convention.dayBoundary');
    }
    return null;
  }
  return {
    sunriseLimb: sunriseLimb as CalculationConvention['sunriseLimb'],
    refraction: refraction as CalculationConvention['refraction'],
    dayBoundary: 'sunrise-to-next-sunrise',
    monthSystem: monthSystem as CalculationConvention['monthSystem'],
  };
}

function parseOutcome(value: unknown, missing: string[]): PanchangOutcome | null {
  if (!isRecord(value) || typeof value.status !== 'string') {
    missing.push('result.status');
    return null;
  }
  if (value.status === 'unavailable') {
    return {
      status: 'unavailable',
      ...(typeof value.reason === 'string' ? { reason: value.reason } : {}),
    };
  }
  if (value.status === 'error') {
    const source = parseSource(value.source, missing);
    const httpStatus = numberField(value, 'httpStatus', missing, 'result.httpStatus');
    if (!source || httpStatus === null) {
      return null;
    }
    return {
      status: 'error',
      source,
      httpStatus,
      ...(value.providerCode === null || typeof value.providerCode === 'string'
        ? { providerCode: value.providerCode }
        : {}),
      ...(typeof value.message === 'string' ? { message: value.message } : {}),
    };
  }
  if (value.status !== 'ok') {
    missing.push('result.status');
    return null;
  }
  const source = parseSource(value.source, missing);
  const vaara = stringField(value, 'vaara', missing, 'result.vaara');
  const sunrise = stringField(value, 'sunrise', missing, 'result.sunrise');
  const sunset = stringField(value, 'sunset', missing, 'result.sunset');
  const tithi = namedList(value.tithi, 'result.tithi', missing);
  const nakshatra = namedList(value.nakshatra, 'result.nakshatra', missing);
  const yoga = namedList(value.yoga, 'result.yoga', missing);
  const karana = namedList(value.karana, 'result.karana', missing);
  if (!source || !vaara || !sunrise || !sunset || !tithi || !nakshatra || !yoga || !karana) {
    return null;
  }
  return {
    status: 'ok',
    source,
    vaara,
    sunrise,
    sunset,
    tithi,
    nakshatra,
    yoga,
    karana,
    ...intervalField(value, 'rahuKaal', missing),
    ...intervalField(value, 'yamaganda', missing),
    ...intervalField(value, 'gulika', missing),
  };
}

function intervalField(
  value: Record<string, unknown>,
  key: 'rahuKaal' | 'yamaganda' | 'gulika',
  missing: string[],
): Partial<Pick<PanchangOk, 'rahuKaal' | 'yamaganda' | 'gulika'>> {
  const interval = optionalInterval(value[key], `result.${key}`, missing);
  if (!interval) {
    return {};
  }
  return { [key]: interval };
}

function parseSource(value: unknown, missing: string[]) {
  if (!isRecord(value)) {
    missing.push('result.source');
    return null;
  }
  const provider = stringField(value, 'provider', missing, 'result.source.provider');
  const retrievedAt = stringField(value, 'retrievedAt', missing, 'result.source.retrievedAt');
  if (!provider || !retrievedAt) {
    return null;
  }
  return {
    provider,
    retrievedAt,
    providerVersion: typeof value.providerVersion === 'string' ? value.providerVersion : null,
    ...(typeof value.operation === 'string' ? { operation: value.operation } : {}),
  };
}

function namedList(value: unknown, label: string, missing: string[]): NamedInterval[] | null {
  if (!Array.isArray(value)) {
    missing.push(label);
    return null;
  }
  const intervals: NamedInterval[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      missing.push(label);
      return null;
    }
    const id = stringField(item, 'id', missing, `${label}.id`);
    const name = stringField(item, 'name', missing, `${label}.name`);
    const start = stringField(item, 'start', missing, `${label}.start`);
    const end = stringField(item, 'end', missing, `${label}.end`);
    if (!id || !name || !start || !end) {
      return null;
    }
    intervals.push({ id, name, start, end });
  }
  return intervals;
}

function optionalInterval(value: unknown, label: string, missing: string[]): TimeInterval | null {
  if (value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    missing.push(label);
    return null;
  }
  const start = stringField(value, 'start', missing, `${label}.start`);
  const end = stringField(value, 'end', missing, `${label}.end`);
  if (!start || !end) {
    return null;
  }
  return { start, end };
}

function stringField(
  record: Record<string, unknown>,
  key: string,
  missing: string[],
  label = key,
): string | null {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    missing.push(label);
    return null;
  }
  return value;
}

function numberField(
  record: Record<string, unknown>,
  key: string,
  missing: string[],
  label = key,
): number | null {
  const value = record[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    missing.push(label);
    return null;
  }
  return value;
}

function nullableNumber(
  record: Record<string, unknown>,
  key: string,
  missing: string[],
): number | null {
  const value = record[key];
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    missing.push(key);
    return null;
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
