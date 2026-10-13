export type PanchangQuery = {
  /** ISO-8601 calendar date, interpreted in `timeZone`. */
  calendarDate: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, for example Asia/Kolkata. */
  timeZone: string;
};

export type PanchangResult = {
  status: 'unavailable';
};

export function getPanchangAvailability(): PanchangResult {
  return { status: 'unavailable' };
}

/**
 * Accepts the future request shape and does not calculate a Panchang.
 * Different locations must not produce invented differences.
 */
export function getPanchang(_query: PanchangQuery): PanchangResult {
  return getPanchangAvailability();
}
