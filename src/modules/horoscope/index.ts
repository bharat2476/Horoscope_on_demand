/**
 * The twelve Rashis are category labels, not horoscope text.
 * Spellings are conventional transliterations, not a full IAST edition.
 */
export const RASHIS = [
  { id: 'mesha', label: 'Mesha (Aries)' },
  { id: 'vrishabha', label: 'Vrishabha (Taurus)' },
  { id: 'mithuna', label: 'Mithuna (Gemini)' },
  { id: 'karka', label: 'Karka (Cancer)' },
  { id: 'simha', label: 'Simha (Leo)' },
  { id: 'kanya', label: 'Kanya (Virgo)' },
  { id: 'tula', label: 'Tula (Libra)' },
  { id: 'vrishchika', label: 'Vrishchika (Scorpio)' },
  { id: 'dhanu', label: 'Dhanu (Sagittarius)' },
  { id: 'makara', label: 'Makara (Capricorn)' },
  { id: 'kumbha', label: 'Kumbha (Aquarius)' },
  { id: 'meena', label: 'Meena (Pisces)' },
] as const;

export type RashiId = (typeof RASHIS)[number]['id'];

const RASHI_IDS = new Set<string>(RASHIS.map((rashi) => rashi.id));

export function isRashiId(value: unknown): value is RashiId {
  return typeof value === 'string' && RASHI_IDS.has(value);
}

export type DailyHoroscopeResult = {
  status: 'unavailable';
  rashiId: RashiId | null;
};

/**
 * General Rashi horoscopes must not require birth date, birth time, or birthplace.
 * This function intentionally returns no reading.
 */
export function getDailyHoroscope(rashiId: RashiId | null): DailyHoroscopeResult {
  return { status: 'unavailable', rashiId };
}
