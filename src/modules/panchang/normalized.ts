/** Provider-neutral Panchang record. Display names are identifiers, not reviewed translations. */

export type AyanamsaId = 'lahiri' | 'lahiri-icrc' | 'raman' | 'kp' | 'kp-new' | 'tropical';

export type SunriseLimb = 'upper-limb' | 'middle-limb' | 'unspecified';

export type Refraction = 'standard' | 'none' | 'unspecified';

export type MonthSystem = 'amanta' | 'purnimanta' | 'both' | 'unspecified';

export type Ayanamsa = {
  id: AyanamsaId;
  providerCode: string | number | null;
  arcseconds: number | null;
};

export type PanchangQueryInput = {
  calendarDate: string;
  latitude: number;
  longitude: number;
  elevationMeters: number | null;
  timeZone: string;
  instant: string;
  ayanamsa: Ayanamsa;
  cityId?: string;
};

export type CalculationConvention = {
  sunriseLimb: SunriseLimb;
  refraction: Refraction;
  dayBoundary: 'sunrise-to-next-sunrise';
  monthSystem: MonthSystem;
};

export type TimeInterval = {
  start: string;
  end: string;
};

export type NamedInterval = TimeInterval & {
  id: string;
  name: string;
  paksha?: 'shukla' | 'krishna';
  lord?: string;
  pada?: number;
};

export type PanchangSource = {
  provider: string;
  operation?: string;
  retrievedAt: string;
  providerVersion: string | null;
  creditsCharged?: number | null;
};

export type PanchangOk = {
  status: 'ok';
  source: PanchangSource;
  vaara: string;
  sunrise: string;
  sunset: string;
  moonrise?: string | null;
  moonset?: string | null;
  tithi: NamedInterval[];
  nakshatra: NamedInterval[];
  yoga: NamedInterval[];
  karana: NamedInterval[];
  rahuKaal?: TimeInterval;
  yamaganda?: TimeInterval;
  gulika?: TimeInterval;
};

export type PanchangError = {
  status: 'error';
  source: PanchangSource;
  httpStatus: number;
  providerCode?: string | null;
  message?: string;
};

export type PanchangUnavailable = {
  status: 'unavailable';
  reason?: string;
};

export type PanchangOutcome = PanchangOk | PanchangError | PanchangUnavailable;

export type NormalizedPanchang = {
  schemaVersion: '1';
  query: PanchangQueryInput;
  convention: CalculationConvention;
  result: PanchangOutcome;
};

export const REFERENCE_CONVENTION: CalculationConvention = {
  sunriseLimb: 'upper-limb',
  refraction: 'standard',
  dayBoundary: 'sunrise-to-next-sunrise',
  monthSystem: 'both',
};
