/** Calculation settings shared by the server adapters. The public screens do not read these results. */

export const CALCULATION_ENGINES = ['fusion-strings', 'vedastro'] as const;

export type CalculationEngine = (typeof CALCULATION_ENGINES)[number];

export const AYANAMSAS = ['lahiri', 'raman', 'krishnamurti'] as const;

export type AyanamsaSetting = (typeof AYANAMSAS)[number];

/**
 * Vedic charts in this app use whole sign unless a caller names another system.
 * Fusion Strings can also calculate Placidus and equal houses. VedAstro's
 * planet-sign methods report sign occupancy, which is the whole-sign placement.
 */
export const HOUSE_SYSTEMS = ['whole-sign', 'placidus', 'equal', 'not-applicable'] as const;

export type HouseSystem = (typeof HOUSE_SYSTEMS)[number];

export type Verification = 'unverified';

export type EngineStamp = {
  engine: CalculationEngine;
  engineVersion: string | null;
  ephemerisVersion: string | null;
  ayanamsa: AyanamsaSetting;
  houseSystem: HouseSystem;
  verification: Verification;
};

export type GeoInput = {
  latitude: number;
  longitude: number;
  elevationMeters: number | null;
  timeZone: string;
};

export type BirthInput = GeoInput & {
  /** Local civil date, YYYY-MM-DD. */
  date: string;
  /** Local 24-hour time, HH:MM. Absent when the birth time is unknown. */
  time: string | null;
  /** Offset in force at that place and date, such as +05:30. This app does not look one up. */
  utcOffset: string | null;
};

export type InputIssue = { code: string; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const OFFSET = /^[+-](?:0\d|1[0-4]):[0-5]\d$/;

export function issuesForPlace(input: GeoInput): InputIssue[] {
  const issues: InputIssue[] = [];
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    issues.push({ code: 'invalid-latitude', message: 'Latitude must be between -90 and 90.' });
  }
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    issues.push({ code: 'invalid-longitude', message: 'Longitude must be between -180 and 180.' });
  }
  if (input.elevationMeters !== null && !Number.isFinite(input.elevationMeters)) {
    issues.push({
      code: 'invalid-elevation',
      message: 'Elevation must be a finite number of meters.',
    });
  }
  if (input.timeZone.trim().length === 0) {
    issues.push({ code: 'missing-timezone', message: 'A time zone name is required.' });
  }
  return issues;
}

export function issuesForBirth(input: BirthInput): InputIssue[] {
  const issues = issuesForPlace(input);
  if (!DATE.test(input.date)) {
    issues.push({ code: 'invalid-date', message: 'Birth date must be YYYY-MM-DD.' });
  }
  if (input.time === null) {
    issues.push({
      code: 'missing-birth-time',
      message: 'A precise birth time is required for a chart.',
    });
  } else if (!CLOCK.test(input.time)) {
    issues.push({
      code: 'invalid-birth-time',
      message: 'Birth time must be HH:MM in 24-hour form.',
    });
  }
  if (input.utcOffset === null || !OFFSET.test(input.utcOffset)) {
    issues.push({
      code: 'missing-offset',
      message: 'The UTC offset in force at birth must be supplied, for example +05:30.',
    });
  }
  return issues;
}

/** VedAstro rejects ISO-8601. The documented form is HH:MM DD/MM/YYYY ±HH:MM. */
export function toVedAstroStdTime(input: BirthInput): string | null {
  if (issuesForBirth(input).length > 0 || input.time === null || input.utcOffset === null) {
    return null;
  }
  const [year, month, day] = input.date.split('-');
  return `${input.time} ${day}/${month}/${year} ${input.utcOffset}`;
}
