import {
  type NamedInterval,
  type NormalizedPanchang,
  type PanchangOk,
  type TimeInterval,
} from '@/modules/panchang/normalized';
import { differenceSeconds, parseInstant } from '@/modules/panchang/time';

/** Relative to the reference only. Two providers agreeing never produces this as `pass`. */
export type FieldVerdict = 'pass' | 'record' | 'fail' | 'missing' | 'unexplained' | 'error';

export type ComparisonRow = {
  caseId: string;
  ruleId: string;
  provider: string;
  providerVersion: string;
  field: string;
  verdict: FieldVerdict;
  differenceSeconds: number | null;
  referenceValue: string;
  providerValue: string;
  detail: string;
};

const ALIGNED_SUN_SECONDS = 60;
const UNSPECIFIED_SUN_SECONDS = 180;
const BOUNDARY_PASS_SECONDS = 120;
const BOUNDARY_RECORD_SECONDS = 600;
const NAME_BOUNDARY_SECONDS = 600;

export function providerAgreement(
  left: NormalizedPanchang,
  right: NormalizedPanchang,
): { fieldsAgree: boolean; labeledCorrect: false } {
  return {
    fieldsAgree: JSON.stringify(comparableBody(left)) === JSON.stringify(comparableBody(right)),
    labeledCorrect: false,
  };
}

export function compareToReference(
  caseId: string,
  ruleId: string,
  reference: NormalizedPanchang,
  providerRecord: NormalizedPanchang | null,
): ComparisonRow[] {
  const providerName =
    providerRecord?.result.status === 'unavailable' ? '' : providerLabel(providerRecord);
  const version = providerVersion(providerRecord);

  if (providerRecord?.result.status === 'error') {
    return [
      row({
        caseId,
        ruleId,
        provider: providerRecord.result.source.provider,
        providerVersion: providerRecord.result.source.providerVersion ?? '',
        field: 'result',
        verdict: 'error',
        referenceValue: '',
        providerValue: providerRecord.result.message ?? '',
        detail: `HTTP ${providerRecord.result.httpStatus}`,
      }),
    ];
  }

  if (reference.result.status !== 'ok') {
    return [
      row({
        caseId,
        ruleId,
        provider: providerName,
        providerVersion: version,
        field: 'reference',
        verdict: 'missing',
        referenceValue: reference.result.status,
        providerValue: providerRecord ? providerRecord.result.status : '',
        detail: 'Approved reference result is not available for this case.',
      }),
    ];
  }

  if (!providerRecord || providerRecord.result.status !== 'ok') {
    return [
      row({
        caseId,
        ruleId,
        provider: providerName,
        providerVersion: version,
        field: 'result',
        verdict: 'missing',
        referenceValue: 'ok',
        providerValue: providerRecord?.result.status ?? '',
        detail: 'Provider response is missing.',
      }),
    ];
  }

  if (providerRecord.query.ayanamsa.id !== reference.query.ayanamsa.id) {
    return [
      row({
        caseId,
        ruleId,
        provider: providerRecord.result.source.provider,
        providerVersion: providerRecord.result.source.providerVersion ?? '',
        field: 'ayanamsa',
        verdict: 'unexplained',
        referenceValue: reference.query.ayanamsa.id,
        providerValue: providerRecord.query.ayanamsa.id,
        detail: 'Ayanamsa differs. Agreement with another provider is not accuracy.',
      }),
    ];
  }

  const referenceOk = reference.result;
  const providerOk = providerRecord.result;
  const base = {
    caseId,
    ruleId,
    provider: providerOk.source.provider,
    providerVersion: providerOk.source.providerVersion ?? '',
  };
  const sunriseDelta = compareClock(referenceOk.sunrise, providerOk.sunrise);
  const rows: ComparisonRow[] = [
    clockRow(
      base,
      'sunrise',
      referenceOk.sunrise,
      providerOk.sunrise,
      conventionDetail(reference, providerRecord),
    ),
    clockRow(
      base,
      'sunset',
      referenceOk.sunset,
      providerOk.sunset,
      conventionDetail(reference, providerRecord),
    ),
    ...intervalRows(
      base,
      'rahuKaal',
      'Rahu Kaal',
      referenceOk.rahuKaal,
      providerOk.rahuKaal,
      sunriseDelta,
    ),
    ...intervalRows(
      base,
      'yamaganda',
      'Yamaganda',
      referenceOk.yamaganda,
      providerOk.yamaganda,
      sunriseDelta,
    ),
    ...intervalRows(base, 'gulika', 'Gulika', referenceOk.gulika, providerOk.gulika, sunriseDelta),
    ...namedRows(base, 'tithi', referenceOk.tithi, providerOk.tithi),
    ...namedRows(base, 'nakshatra', referenceOk.nakshatra, providerOk.nakshatra),
    ...namedRows(base, 'yoga', referenceOk.yoga, providerOk.yoga),
    ...namedRows(base, 'karana', referenceOk.karana, providerOk.karana),
  ];
  return rows;
}

function clockRow(
  base: Pick<ComparisonRow, 'caseId' | 'ruleId' | 'provider' | 'providerVersion'>,
  field: string,
  referenceValue: string,
  providerValue: string,
  convention: string | null,
): ComparisonRow {
  const delta = compareClock(referenceValue, providerValue);
  if (delta === null) {
    return row({
      ...base,
      field,
      verdict: 'missing',
      referenceValue,
      providerValue,
      detail: 'Clock time is missing.',
    });
  }
  if (convention && Math.abs(delta) <= UNSPECIFIED_SUN_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'record',
      differenceSeconds: delta,
      referenceValue,
      providerValue,
      detail: convention,
    });
  }
  if (convention && Math.abs(delta) > UNSPECIFIED_SUN_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'unexplained',
      differenceSeconds: delta,
      referenceValue,
      providerValue,
      detail: `${convention}; difference exceeds 3 minutes.`,
    });
  }
  if (Math.abs(delta) <= ALIGNED_SUN_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'pass',
      differenceSeconds: delta,
      referenceValue,
      providerValue,
      detail: '',
    });
  }
  return row({
    ...base,
    field,
    verdict: 'fail',
    differenceSeconds: delta,
    referenceValue,
    providerValue,
    detail: 'Sunrise or sunset differs by more than 60 seconds under the same convention.',
  });
}

function intervalRows(
  base: Pick<ComparisonRow, 'caseId' | 'ruleId' | 'provider' | 'providerVersion'>,
  field: string,
  label: string,
  referenceInterval: TimeInterval | undefined,
  providerInterval: TimeInterval | undefined,
  sunriseDelta: number | null,
): ComparisonRow[] {
  if (!referenceInterval && !providerInterval) {
    return [];
  }
  if (!referenceInterval || !providerInterval) {
    return [
      row({
        ...base,
        field,
        verdict: 'missing',
        referenceValue: referenceInterval
          ? `${referenceInterval.start}/${referenceInterval.end}`
          : '',
        providerValue: providerInterval ? `${providerInterval.start}/${providerInterval.end}` : '',
        detail: `${label} interval is missing.`,
      }),
    ];
  }
  return (['start', 'end'] as const).map((edge) => {
    const delta = compareClock(referenceInterval[edge], providerInterval[edge]);
    if (delta === null) {
      return row({
        ...base,
        field: `${field}.${edge}`,
        verdict: 'missing',
        referenceValue: referenceInterval[edge],
        providerValue: providerInterval[edge],
        detail: '',
      });
    }
    if (Math.abs(delta) <= ALIGNED_SUN_SECONDS) {
      return row({
        ...base,
        field: `${field}.${edge}`,
        verdict: 'pass',
        differenceSeconds: delta,
        referenceValue: referenceInterval[edge],
        providerValue: providerInterval[edge],
        detail: '',
      });
    }
    if (sunriseDelta !== null && Math.abs(delta - sunriseDelta) <= ALIGNED_SUN_SECONDS) {
      return row({
        ...base,
        field: `${field}.${edge}`,
        verdict: 'record',
        differenceSeconds: delta,
        referenceValue: referenceInterval[edge],
        providerValue: providerInterval[edge],
        detail: 'Interval shifts with the sunrise difference.',
      });
    }
    return row({
      ...base,
      field: `${field}.${edge}`,
      verdict: 'fail',
      differenceSeconds: delta,
      referenceValue: referenceInterval[edge],
      providerValue: providerInterval[edge],
      detail: `${label} shift is not explained by the sunrise difference.`,
    });
  });
}

function namedRows(
  base: Pick<ComparisonRow, 'caseId' | 'ruleId' | 'provider' | 'providerVersion'>,
  field: string,
  referenceIntervals: NamedInterval[],
  providerIntervals: NamedInterval[],
): ComparisonRow[] {
  const referenceOrdered = [...referenceIntervals].sort(byStart);
  const providerOrdered = [...providerIntervals].sort(byStart);
  const count = Math.max(referenceOrdered.length, providerOrdered.length);
  const rows: ComparisonRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const referenceInterval = referenceOrdered[index];
    const providerInterval = providerOrdered[index];
    if (!referenceInterval || !providerInterval) {
      rows.push(
        row({
          ...base,
          field: `${field}[${index}]`,
          verdict: referenceInterval && !providerInterval ? 'missing' : 'unexplained',
          referenceValue: referenceInterval?.name ?? '',
          providerValue: providerInterval?.name ?? '',
          detail: referenceInterval
            ? 'Provider omitted a transition.'
            : 'Provider returned an extra transition.',
        }),
      );
      continue;
    }
    const endDelta = compareClock(referenceInterval.end, providerInterval.end);
    const namesMatch =
      normalizeName(referenceInterval.name) === normalizeName(providerInterval.name);
    rows.push(
      nameVerdict(
        base,
        `${field}[${index}].name`,
        referenceInterval,
        providerInterval,
        namesMatch,
        endDelta,
      ),
    );
    rows.push(
      boundaryVerdict(
        base,
        `${field}[${index}].end`,
        referenceInterval.end,
        providerInterval.end,
        endDelta,
      ),
    );
  }
  return rows;
}

function nameVerdict(
  base: Pick<ComparisonRow, 'caseId' | 'ruleId' | 'provider' | 'providerVersion'>,
  field: string,
  referenceInterval: NamedInterval,
  providerInterval: NamedInterval,
  namesMatch: boolean,
  endDelta: number | null,
): ComparisonRow {
  if (namesMatch) {
    return row({
      ...base,
      field,
      verdict: 'pass',
      referenceValue: referenceInterval.name,
      providerValue: providerInterval.name,
      detail: '',
    });
  }
  if (endDelta !== null && Math.abs(endDelta) <= NAME_BOUNDARY_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'record',
      differenceSeconds: endDelta,
      referenceValue: referenceInterval.name,
      providerValue: providerInterval.name,
      detail: 'Names differ within 10 minutes of a boundary.',
    });
  }
  return row({
    ...base,
    field,
    verdict: 'fail',
    differenceSeconds: endDelta,
    referenceValue: referenceInterval.name,
    providerValue: providerInterval.name,
    detail: 'Names differ away from a boundary.',
  });
}

function boundaryVerdict(
  base: Pick<ComparisonRow, 'caseId' | 'ruleId' | 'provider' | 'providerVersion'>,
  field: string,
  referenceValue: string,
  providerValue: string,
  delta: number | null,
): ComparisonRow {
  if (delta === null) {
    return row({ ...base, field, verdict: 'missing', referenceValue, providerValue, detail: '' });
  }
  if (Math.abs(delta) <= BOUNDARY_PASS_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'pass',
      differenceSeconds: delta,
      referenceValue,
      providerValue,
      detail: '',
    });
  }
  if (Math.abs(delta) <= BOUNDARY_RECORD_SECONDS) {
    return row({
      ...base,
      field,
      verdict: 'record',
      differenceSeconds: delta,
      referenceValue,
      providerValue,
      detail: 'Boundary differs by more than 2 minutes and at most 10 minutes.',
    });
  }
  return row({
    ...base,
    field,
    verdict: 'fail',
    differenceSeconds: delta,
    referenceValue,
    providerValue,
    detail: 'Boundary differs by more than 10 minutes.',
  });
}

function conventionDetail(
  reference: NormalizedPanchang,
  provider: NormalizedPanchang,
): string | null {
  const notes: string[] = [];
  if (reference.convention.sunriseLimb !== provider.convention.sunriseLimb) {
    notes.push(
      `sunrise limb ${reference.convention.sunriseLimb} vs ${provider.convention.sunriseLimb}`,
    );
  }
  if (reference.convention.refraction !== provider.convention.refraction) {
    notes.push(
      `refraction ${reference.convention.refraction} vs ${provider.convention.refraction}`,
    );
  }
  if (reference.query.elevationMeters !== provider.query.elevationMeters) {
    notes.push('elevation differs');
  }
  if (notes.length === 0) {
    return null;
  }
  return `convention: ${notes.join('; ')}`;
}

function compareClock(referenceValue: string, providerValue: string): number | null {
  if (!referenceValue || !providerValue) {
    return null;
  }
  return differenceSeconds(referenceValue, providerValue);
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

function providerLabel(record: NormalizedPanchang | null): string {
  if (!record || record.result.status === 'unavailable') {
    return '';
  }
  return record.result.source.provider;
}

function providerVersion(record: NormalizedPanchang | null): string {
  if (!record || record.result.status === 'unavailable') {
    return '';
  }
  return record.result.source.providerVersion ?? '';
}

function comparableBody(record: NormalizedPanchang): unknown {
  if (record.result.status !== 'ok') {
    return record.result;
  }
  return {
    vaara: record.result.vaara,
    sunrise: record.result.sunrise,
    sunset: record.result.sunset,
    tithi: record.result.tithi,
    nakshatra: record.result.nakshatra,
    yoga: record.result.yoga,
    karana: record.result.karana,
    rahuKaal: record.result.rahuKaal ?? null,
  };
}

function byStart(left: NamedInterval, right: NamedInterval): number {
  return parseInstant(left.start) - parseInstant(right.start);
}

function row(
  input: Omit<ComparisonRow, 'differenceSeconds'> & { differenceSeconds?: number | null },
): ComparisonRow {
  return {
    differenceSeconds: null,
    ...input,
  };
}

export function activeInterval(
  intervals: NamedInterval[],
  instant: string,
): NamedInterval | undefined {
  const at = parseInstant(instant);
  return [...intervals]
    .sort((left, right) => parseInstant(left.start) - parseInstant(right.start))
    .find((interval) => parseInstant(interval.start) <= at && parseInstant(interval.end) > at);
}

export function isOk(
  record: NormalizedPanchang,
): record is NormalizedPanchang & { result: PanchangOk } {
  return record.result.status === 'ok';
}
