import { Platform } from 'react-native';

import { isRashiId, type RashiId } from '@/modules/horoscope/rashis';

export type ShownPanchang = {
  status: 'accepted';
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  nearBoundary: boolean;
};

export type ShownTransit = {
  status: 'accepted';
  moonSignId: RashiId;
  sunSignId: RashiId;
  moonHouse: number;
  sunHouse: number;
};

const CLOCK = /^\d{2}:\d{2}$/;

/** Web on this machine talks to the local calculation server. A phone build needs EXPO_PUBLIC_CALCULATION_URL. */
export function calculationOrigin(): string | null {
  const configured = process.env.EXPO_PUBLIC_CALCULATION_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (
    Platform.OS === 'web' &&
    typeof globalThis.location === 'object' &&
    /^(localhost|127\.0\.0\.1)$/.test(globalThis.location.hostname)
  ) {
    return 'http://127.0.0.1:8082';
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function parseShownPanchang(value: unknown): ShownPanchang | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  const tithi = text(row.tithi);
  const nakshatra = text(row.nakshatra);
  const yoga = text(row.yoga);
  const karana = text(row.karana);
  const sunrise = text(row.sunrise);
  const sunset = text(row.sunset);
  if (
    row.status !== 'accepted' ||
    !tithi ||
    !nakshatra ||
    !yoga ||
    !karana ||
    !sunrise ||
    !sunset ||
    !CLOCK.test(sunrise) ||
    !CLOCK.test(sunset)
  ) {
    return null;
  }
  return {
    status: 'accepted',
    tithi,
    nakshatra,
    yoga,
    karana,
    sunrise,
    sunset,
    nearBoundary: row.nearBoundary === true,
  };
}

export function parseShownTransit(value: unknown): ShownTransit | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (
    row.status !== 'accepted' ||
    !isRashiId(row.moonSignId) ||
    !isRashiId(row.sunSignId) ||
    typeof row.moonHouse !== 'number' ||
    typeof row.sunHouse !== 'number' ||
    row.moonHouse < 1 ||
    row.moonHouse > 12 ||
    row.sunHouse < 1 ||
    row.sunHouse > 12
  ) {
    return null;
  }
  return {
    status: 'accepted',
    moonSignId: row.moonSignId,
    sunSignId: row.sunSignId,
    moonHouse: row.moonHouse,
    sunHouse: row.sunHouse,
  };
}
