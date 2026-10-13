/**
 * The twelve Rashis are category labels, not horoscope text.
 * Spellings are conventional transliterations, not a full IAST edition.
 */
export const RASHIS = [
  { id: 'mesha', label: 'Mesha (Aries)', sanskrit: 'मेष' },
  { id: 'vrishabha', label: 'Vrishabha (Taurus)', sanskrit: 'वृषभ' },
  { id: 'mithuna', label: 'Mithuna (Gemini)', sanskrit: 'मिथुन' },
  { id: 'karka', label: 'Karka (Cancer)', sanskrit: 'कर्क' },
  { id: 'simha', label: 'Simha (Leo)', sanskrit: 'सिंह' },
  { id: 'kanya', label: 'Kanya (Virgo)', sanskrit: 'कन्या' },
  { id: 'tula', label: 'Tula (Libra)', sanskrit: 'तुला' },
  { id: 'vrishchika', label: 'Vrishchika (Scorpio)', sanskrit: 'वृश्चिक' },
  { id: 'dhanu', label: 'Dhanu (Sagittarius)', sanskrit: 'धनु' },
  { id: 'makara', label: 'Makara (Capricorn)', sanskrit: 'मकर' },
  { id: 'kumbha', label: 'Kumbha (Aquarius)', sanskrit: 'कुम्भ' },
  { id: 'meena', label: 'Meena (Pisces)', sanskrit: 'मीन' },
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
