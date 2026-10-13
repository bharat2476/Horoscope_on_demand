import {
  compareToReference,
  providerAgreement,
  type ComparisonRow,
} from '@/modules/panchang/compare';
import { comparisonToCsv } from '@/modules/panchang/csv-report';
import {
  REFERENCE_CONVENTION,
  type CalculationConvention,
  type NormalizedPanchang,
  type PanchangOk,
} from '@/modules/panchang/normalized';

const query = {
  calendarDate: '2026-10-14',
  latitude: 23.0225,
  longitude: 72.5714,
  elevationMeters: null as number | null,
  timeZone: 'Asia/Kolkata',
  instant: '2026-10-14T12:00:00+05:30',
  ayanamsa: { id: 'lahiri' as const, providerCode: null, arcseconds: null },
  cityId: 'gj-ahmedabad',
};

function named(id: string, end: string) {
  return { id, name: id, start: '2026-10-13T06:30:00+05:30', end };
}

function okResult(patch: Partial<PanchangOk> = {}): PanchangOk {
  return {
    status: 'ok',
    source: {
      provider: 'fixture-provider',
      retrievedAt: '2026-10-14T12:00:01+05:30',
      providerVersion: 'fixture-1',
    },
    vaara: 'fixture-vaara',
    sunrise: '2026-10-14T06:30:00+05:30',
    sunset: '2026-10-14T18:10:00+05:30',
    tithi: [named('fixture-tithi', '2026-10-14T08:00:00+05:30')],
    nakshatra: [named('fixture-nakshatra', '2026-10-14T09:00:00+05:30')],
    yoga: [named('fixture-yoga', '2026-10-14T10:00:00+05:30')],
    karana: [named('fixture-karana', '2026-10-14T07:15:00+05:30')],
    rahuKaal: { start: '2026-10-14T07:45:00+05:30', end: '2026-10-14T09:15:00+05:30' },
    ...patch,
  };
}

function record(
  result: NormalizedPanchang['result'],
  options: {
    convention?: CalculationConvention;
    ayanamsaId?: NormalizedPanchang['query']['ayanamsa']['id'];
    elevationMeters?: number | null;
  } = {},
): NormalizedPanchang {
  return {
    schemaVersion: '1',
    query: {
      ...query,
      elevationMeters: options.elevationMeters ?? query.elevationMeters,
      ayanamsa: { ...query.ayanamsa, id: options.ayanamsaId ?? 'lahiri' },
    },
    convention: options.convention ?? REFERENCE_CONVENTION,
    result,
  };
}

function verdict(rows: ComparisonRow[], field: string): ComparisonRow {
  const found = rows.find((entry) => entry.field === field);
  if (!found) {
    throw new Error(`Missing comparison row ${field}`);
  }
  return found;
}

describe('panchang comparison', () => {
  const reference = record(okResult({ source: { ...okResult().source, provider: 'reference' } }));

  it('passes a same-convention clock within 60 seconds and fails a larger gap', () => {
    const close = record(
      okResult({ sunrise: '2026-10-14T06:30:30+05:30', sunset: '2026-10-14T18:12:00+05:30' }),
    );
    const rows = compareToReference('fixture-case', 'ordinary', reference, close);
    expect(verdict(rows, 'sunrise')).toMatchObject({ verdict: 'pass', differenceSeconds: 30 });
    expect(verdict(rows, 'sunset')).toMatchObject({ verdict: 'fail', differenceSeconds: 120 });
  });

  it('records a limb or elevation difference inside 3 minutes and leaves a larger gap unexplained', () => {
    const limb = record(okResult({ sunrise: '2026-10-14T06:32:00+05:30' }), {
      convention: { ...REFERENCE_CONVENTION, sunriseLimb: 'middle-limb' },
    });
    const elevation = record(okResult({ sunrise: '2026-10-14T06:34:00+05:30' }), {
      elevationMeters: 55,
    });
    expect(
      verdict(compareToReference('fixture-case', 'ordinary', reference, limb), 'sunrise').verdict,
    ).toBe('record');
    expect(
      verdict(compareToReference('fixture-case', 'ordinary', reference, elevation), 'sunrise')
        .verdict,
    ).toBe('unexplained');
  });

  it('records a name change near a boundary and fails one farther away', () => {
    const near = record(
      okResult({ tithi: [named('fixture-tithi-other', '2026-10-14T08:03:00+05:30')] }),
    );
    const far = record(
      okResult({ tithi: [named('fixture-tithi-other', '2026-10-14T08:20:00+05:30')] }),
    );
    expect(
      verdict(
        compareToReference('fixture-case', 'tithi-near-sunrise', reference, near),
        'tithi[0].name',
      ),
    ).toMatchObject({
      verdict: 'record',
    });
    expect(
      verdict(compareToReference('fixture-case', 'ordinary', reference, far), 'tithi[0].name')
        .verdict,
    ).toBe('fail');
    expect(
      verdict(compareToReference('fixture-case', 'ordinary', reference, far), 'tithi[0].end')
        .verdict,
    ).toBe('fail');
  });

  it('records a Rahu Kaal shift that follows sunrise and fails a different segment', () => {
    const shifted = record(
      okResult({
        sunrise: '2026-10-14T06:32:00+05:30',
        rahuKaal: { start: '2026-10-14T07:47:00+05:30', end: '2026-10-14T09:17:00+05:30' },
      }),
    );
    const otherSegment = record(
      okResult({
        rahuKaal: { start: '2026-10-14T09:15:00+05:30', end: '2026-10-14T10:45:00+05:30' },
      }),
    );
    expect(
      verdict(compareToReference('fixture-case', 'ordinary', reference, shifted), 'rahuKaal.start')
        .verdict,
    ).toBe('record');
    expect(
      verdict(
        compareToReference('fixture-case', 'ordinary', reference, otherSegment),
        'rahuKaal.start',
      ).verdict,
    ).toBe('fail');
  });

  it('does not score a provider when the ayanamsa differs', () => {
    const other = record(okResult(), { ayanamsaId: 'raman' });
    const rows = compareToReference('fixture-case', 'ordinary', reference, other);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ field: 'ayanamsa', verdict: 'unexplained' });
  });

  it('keeps an API error as one error row and does not invent field values', () => {
    const failed = record({
      status: 'error',
      source: {
        provider: 'fixture-provider',
        retrievedAt: '2026-10-14T12:00:02+05:30',
        providerVersion: 'fixture-1',
      },
      httpStatus: 503,
      providerCode: 'http',
      message: 'unavailable upstream',
    });
    const rows = compareToReference('fixture-case', 'ordinary', reference, failed);
    expect(rows).toEqual([
      expect.objectContaining({
        field: 'result',
        verdict: 'error',
        providerValue: 'unavailable upstream',
      }),
    ]);
    expect(rows.some((entry) => entry.field.startsWith('tithi'))).toBe(false);
  });

  it('reports a pending reference as missing instead of scoring the provider', () => {
    const pending = record({
      status: 'unavailable',
      reason: 'Astronomical reference has not been computed for this place and date.',
    });
    const rows = compareToReference('fixture-case', 'ordinary', pending, reference);
    expect(rows.map((entry) => entry.verdict)).toEqual(['missing']);
  });

  it('never labels agreement between two providers as correct', () => {
    const agreed = providerAgreement(reference, reference);
    expect(agreed.fieldsAgree).toBe(true);
    expect(agreed.labeledCorrect).toBe(false);
    const rows = compareToReference('fixture-case', 'ordinary', reference, reference);
    expect(rows.some((entry) => entry.verdict === ('correct' as ComparisonRow['verdict']))).toBe(
      false,
    );
  });

  it('writes missing data, differences, and unexplained mismatches to CSV', () => {
    const csv = comparisonToCsv([
      {
        caseId: 'fixture-case',
        ruleId: 'ordinary',
        provider: 'fixture-provider',
        providerVersion: 'fixture-1',
        field: 'sunrise',
        verdict: 'unexplained',
        differenceSeconds: 240,
        referenceValue: '2026-10-14T06:30:00+05:30',
        providerValue: '2026-10-14T06:34:00+05:30',
        detail: 'convention: elevation differs, "quoted"',
      },
    ]);
    expect(csv.split('\n')[0]).toBe(
      'caseId,ruleId,provider,providerVersion,field,verdict,differenceSeconds,referenceValue,providerValue,detail',
    );
    expect(csv).toContain('unexplained');
    expect(csv).toContain('"convention: elevation differs, ""quoted"""');
  });
});
