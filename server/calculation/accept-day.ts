import { createRequire } from 'node:module';

import { EclipticGeoMoon, SunPosition } from 'astronomy-engine';

import {
  compareAnga,
  karanaFromLongitudes,
  nakshatraFromLongitude,
  signFromLongitude,
  tithiFromLongitudes,
  wholeSignHouse,
  wrap360,
  yogaFromLongitudes,
  type AngaMatch,
} from '@/modules/calculation/angas';
import { isRashiId, RASHIS, type RashiId } from '@/modules/horoscope/rashis';
import { formatInstant } from '@/modules/panchang/time';

import { CITY_ELEVATION_METERS, CITY_TIME_ZONE, cityPoint } from './city-points';

export type AcceptedPanchang = {
  status: 'accepted';
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  nearBoundary: boolean;
  engine: 'fusion-strings';
  engineVersion: string;
  ephemerisVersion: string;
  ayanamsa: 'lahiri';
};

export type AcceptedTransit = {
  status: 'accepted';
  moonSignId: RashiId;
  sunSignId: RashiId;
  moonHouse: number;
  sunHouse: number;
  ayanamsa: 'lahiri';
  engine: 'fusion-strings';
  engineVersion: string;
  ephemerisVersion: string;
};

export type CalculationRefusal = { status: 'unavailable' };

type Planet = { name: string; longitude: number; speed: number };

type FusionDaily = {
  sunrise: number;
  sunset: number;
  tithi_index: number;
  nakshatra_index: number;
  yoga_index: number;
  karana_index: number;
  ayanamsha_value: number;
  planets: Planet[];
  free?: () => void;
};

type FusionModule = {
  Location: new (latitude: number, longitude: number, altitude: number) => { free?: () => void };
  calculate_daily_panchang: (
    year: number,
    month: number,
    day: number,
    location: unknown,
    ayanMode: number,
  ) => FusionDaily;
  get_version: () => string;
  get_swisseph_version: () => string;
};

const LAHIRI_MODE = 1;
const MAX_LONGITUDE_DELTA_DEGREES = 0.05;

const requirePackage = createRequire(`${process.cwd()}/package.json`);

function loadFusion(): FusionModule {
  return requirePackage('@fusionstrings/panchangam') as FusionModule;
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100) {
    return false;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function clock(utcMs: number): string {
  const instant = formatInstant(utcMs, CITY_TIME_ZONE);
  return /T(\d{2}:\d{2})/.exec(instant)?.[1] ?? '';
}

function planet(planets: readonly Planet[], name: string): Planet | null {
  return planets.find((item) => item.name === name) ?? null;
}

function allowed(results: readonly AngaMatch[]): boolean {
  return results.every((result) => result === 'match' || result === 'near');
}

function acceptLongitudes(
  daily: {
    tithi_index: number;
    nakshatra_index: number;
    yoga_index: number;
    karana_index: number;
  },
  sunLongitude: number,
  moonLongitude: number,
  sunSpeed: number,
  moonSpeed: number,
): AngaMatch[] | null {
  if (![sunLongitude, moonLongitude, sunSpeed, moonSpeed].every(Number.isFinite)) {
    return null;
  }
  const tithi = tithiFromLongitudes(sunLongitude, moonLongitude);
  const nakshatra = nakshatraFromLongitude(moonLongitude);
  const yoga = yogaFromLongitudes(sunLongitude, moonLongitude);
  const karana = karanaFromLongitudes(sunLongitude, moonLongitude);
  const relative = moonSpeed - sunSpeed;
  return [
    compareAnga(daily.tithi_index, tithi, relative),
    compareAnga(daily.nakshatra_index, nakshatra, moonSpeed),
    compareAnga(daily.yoga_index, yoga, moonSpeed + sunSpeed),
    compareAnga(daily.karana_index, karana, relative),
  ];
}

function readDay(
  cityId: string,
  calendarDate: string,
  fusion: FusionModule,
): { daily: FusionDaily; point: { latitude: number; longitude: number } } | null {
  const point = cityPoint(cityId);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate);
  if (!point || !match || !isCalendarDate(calendarDate)) {
    return null;
  }
  const location = new fusion.Location(point.latitude, point.longitude, CITY_ELEVATION_METERS);
  const daily = fusion.calculate_daily_panchang(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    location,
    LAHIRI_MODE,
  );
  location.free?.();
  return { daily, point };
}

/**
 * Shows a day only when Fusion Strings' names match the classical widths on its
 * own longitudes, and an independent tropical ephemeris agrees after Lahiri is removed.
 * A mismatch stays unavailable. No printed almanac is claimed.
 */
export function acceptPanchang(
  cityId: string,
  calendarDate: string,
  fusion: FusionModule = loadFusion(),
): AcceptedPanchang | CalculationRefusal {
  const read = readDay(cityId, calendarDate, fusion);
  if (!read) {
    return { status: 'unavailable' };
  }
  const { daily } = read;
  const sun = planet(daily.planets, 'Sun');
  const moon = planet(daily.planets, 'Moon');
  const snapshot = {
    tithi_index: daily.tithi_index,
    nakshatra_index: daily.nakshatra_index,
    yoga_index: daily.yoga_index,
    karana_index: daily.karana_index,
    sunLongitude: sun?.longitude ?? Number.NaN,
    moonLongitude: moon?.longitude ?? Number.NaN,
    sunSpeed: sun?.speed ?? Number.NaN,
    moonSpeed: moon?.speed ?? Number.NaN,
    sunriseMs: daily.sunrise,
    sunsetMs: daily.sunset,
    ayanamsa: daily.ayanamsha_value,
  };
  daily.free?.();
  if (
    !sun ||
    !moon ||
    !Number.isFinite(snapshot.sunriseMs) ||
    !Number.isFinite(snapshot.sunsetMs)
  ) {
    return { status: 'unavailable' };
  }
  const own = acceptLongitudes(
    snapshot,
    snapshot.sunLongitude,
    snapshot.moonLongitude,
    snapshot.sunSpeed,
    snapshot.moonSpeed,
  );
  const when = new Date(snapshot.sunriseMs);
  const tropicalSun = SunPosition(when).elon;
  const tropicalMoon = EclipticGeoMoon(when).lon;
  const crossSun = wrap360(tropicalSun - snapshot.ayanamsa);
  const crossMoon = wrap360(tropicalMoon - snapshot.ayanamsa);
  const cross = acceptLongitudes(
    snapshot,
    crossSun,
    crossMoon,
    snapshot.sunSpeed,
    snapshot.moonSpeed,
  );
  const longitudeGap = Math.max(
    Math.abs(wrap360(crossSun - snapshot.sunLongitude + 180) - 180),
    Math.abs(wrap360(crossMoon - snapshot.moonLongitude + 180) - 180),
  );
  const sunrise = clock(snapshot.sunriseMs);
  const sunset = clock(snapshot.sunsetMs);
  const tithi = tithiFromLongitudes(snapshot.sunLongitude, snapshot.moonLongitude);
  const nakshatra = nakshatraFromLongitude(snapshot.moonLongitude);
  const yoga = yogaFromLongitudes(snapshot.sunLongitude, snapshot.moonLongitude);
  const karana = karanaFromLongitudes(snapshot.sunLongitude, snapshot.moonLongitude);
  if (
    !own ||
    !cross ||
    !allowed(own) ||
    !allowed(cross) ||
    longitudeGap > MAX_LONGITUDE_DELTA_DEGREES ||
    !sunrise ||
    !sunset
  ) {
    return { status: 'unavailable' };
  }
  return {
    status: 'accepted',
    tithi: tithi.name,
    nakshatra: nakshatra.name,
    yoga: yoga.name,
    karana: karana.name,
    sunrise,
    sunset,
    nearBoundary: [...own, ...cross].some((item) => item === 'near'),
    engine: 'fusion-strings',
    engineVersion: fusion.get_version(),
    ephemerisVersion: fusion.get_swisseph_version(),
    ayanamsa: 'lahiri',
  };
}

export function acceptTransit(
  cityId: string,
  calendarDate: string,
  rashiId: string,
  fusion: FusionModule = loadFusion(),
): AcceptedTransit | CalculationRefusal {
  if (!isRashiId(rashiId)) {
    return { status: 'unavailable' };
  }
  const day = acceptPanchang(cityId, calendarDate, fusion);
  const read = day.status === 'accepted' ? readDay(cityId, calendarDate, fusion) : null;
  if (day.status !== 'accepted' || !read) {
    return { status: 'unavailable' };
  }
  const sun = planet(read.daily.planets, 'Sun');
  const moon = planet(read.daily.planets, 'Moon');
  read.daily.free?.();
  if (!sun || !moon) {
    return { status: 'unavailable' };
  }
  const sunSign = signFromLongitude(sun.longitude);
  const moonSign = signFromLongitude(moon.longitude);
  const from = RASHIS.findIndex((rashi) => rashi.id === rashiId);
  if (from < 0) {
    return { status: 'unavailable' };
  }
  return {
    status: 'accepted',
    moonSignId: moonSign.id,
    sunSignId: sunSign.id,
    moonHouse: wholeSignHouse(from, moonSign.index),
    sunHouse: wholeSignHouse(from, sunSign.index),
    ayanamsa: 'lahiri',
    engine: 'fusion-strings',
    engineVersion: day.engineVersion,
    ephemerisVersion: day.ephemerisVersion,
  };
}
