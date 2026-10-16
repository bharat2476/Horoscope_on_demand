/**
 * Classical anga widths. These names label longitude bands.
 * They are not a prediction and they are not copied from a website.
 */

import { RASHIS, type RashiId } from '@/modules/horoscope/rashis';

export const TITHI_WIDTH_DEGREES = 12;
export const NAKSHATRA_WIDTH_DEGREES = 360 / 27;
export const KARANA_WIDTH_DEGREES = 6;
export const SIGN_WIDTH_DEGREES = 30;
export const NEAR_BOUNDARY_MINUTES = 10;

const TITHI_IN_PAKSHA = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
] as const;

export const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

export const YOGA_NAMES = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shula',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyan',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti',
] as const;

const MOVABLE_KARANAS = [
  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Gara',
  'Vanija',
  'Vishti',
] as const;

export type AngaMatch = 'match' | 'near' | 'mismatch';

export type AngaBand = {
  index: number;
  name: string;
  intoDegrees: number;
  widthDegrees: number;
};

export function wrap360(value: number): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }
  const turned = value % 360;
  return turned < 0 ? turned + 360 : turned;
}

function band(
  position: number,
  width: number,
  count: number,
  nameAt: (index: number) => string,
): AngaBand {
  const bounded = wrap360(position);
  let bucket = Math.floor(bounded / width);
  if (bucket >= count) {
    bucket = count - 1;
  }
  const index = bucket + 1;
  return {
    index,
    name: nameAt(index),
    intoDegrees: bounded - bucket * width,
    widthDegrees: width,
  };
}

export function tithiName(index: number): string {
  if (index === 15) {
    return 'Shukla Purnima';
  }
  if (index === 30) {
    return 'Krishna Amavasya';
  }
  if (index >= 1 && index <= 14) {
    return `Shukla ${TITHI_IN_PAKSHA[index - 1]}`;
  }
  if (index >= 16 && index <= 29) {
    return `Krishna ${TITHI_IN_PAKSHA[index - 16]}`;
  }
  return '';
}

export function karanaName(index: number): string {
  if (index === 1) {
    return 'Kimstughna';
  }
  if (index >= 2 && index <= 57) {
    return MOVABLE_KARANAS[(index - 2) % MOVABLE_KARANAS.length] ?? '';
  }
  if (index === 58) {
    return 'Shakuni';
  }
  if (index === 59) {
    return 'Chatushpada';
  }
  if (index === 60) {
    return 'Naga';
  }
  return '';
}

/** Elongation is sidereal Moon minus sidereal Sun. Amavasya ends at 0°. Purnima ends at 180°. */
export function tithiFromLongitudes(sunLongitude: number, moonLongitude: number): AngaBand {
  return band(wrap360(moonLongitude - sunLongitude), TITHI_WIDTH_DEGREES, 30, tithiName);
}

export function nakshatraFromLongitude(moonLongitude: number): AngaBand {
  return band(moonLongitude, NAKSHATRA_WIDTH_DEGREES, NAKSHATRA_NAMES.length, (index) => {
    return NAKSHATRA_NAMES[index - 1] ?? '';
  });
}

export function yogaFromLongitudes(sunLongitude: number, moonLongitude: number): AngaBand {
  return band(sunLongitude + moonLongitude, NAKSHATRA_WIDTH_DEGREES, YOGA_NAMES.length, (index) => {
    return YOGA_NAMES[index - 1] ?? '';
  });
}

export function karanaFromLongitudes(sunLongitude: number, moonLongitude: number): AngaBand {
  return band(wrap360(moonLongitude - sunLongitude), KARANA_WIDTH_DEGREES, 60, karanaName);
}

export function signFromLongitude(longitude: number): { index: number; id: RashiId } {
  const bounded = wrap360(longitude);
  const index = Math.min(RASHIS.length - 1, Math.floor(bounded / SIGN_WIDTH_DEGREES));
  return { index, id: RASHIS[index]?.id ?? 'mesha' };
}

/** Whole-sign house of a planet counted from a Rashi. Mesha to Mesha is house 1. */
export function wholeSignHouse(fromSignIndex: number, planetSignIndex: number): number {
  return ((planetSignIndex - fromSignIndex + 12) % 12) + 1;
}

export function minutesAcross(degrees: number, speedDegreesPerDay: number): number | null {
  if (
    !Number.isFinite(degrees) ||
    !Number.isFinite(speedDegreesPerDay) ||
    speedDegreesPerDay <= 0
  ) {
    return null;
  }
  return (degrees / speedDegreesPerDay) * 1440;
}

/**
 * Exact index agreement passes. A one-step difference within 10 minutes of the
 * boundary is recorded and still allowed. Any wider disagreement fails.
 */
export function compareAnga(
  engineIndex: number,
  counted: AngaBand,
  speedDegreesPerDay: number,
): AngaMatch {
  const count = Math.round(360 / counted.widthDegrees);
  if (engineIndex === counted.index) {
    return 'match';
  }
  const step = (engineIndex - counted.index + count) % count;
  const adjacent = step === 1 || step === count - 1;
  const elapsed = minutesAcross(counted.intoDegrees, speedDegreesPerDay);
  const remaining = minutesAcross(counted.widthDegrees - counted.intoDegrees, speedDegreesPerDay);
  const close =
    (elapsed !== null && elapsed <= NEAR_BOUNDARY_MINUTES) ||
    (remaining !== null && remaining <= NEAR_BOUNDARY_MINUTES);
  if (adjacent && close) {
    return 'near';
  }
  return 'mismatch';
}
