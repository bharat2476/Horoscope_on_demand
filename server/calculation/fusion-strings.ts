import { formatInstant } from '../../src/modules/panchang/time';
import {
  REFERENCE_CONVENTION,
  type NamedInterval,
  type NormalizedPanchang,
  type PanchangQueryInput,
} from '../../src/modules/panchang/normalized';
import {
  issuesForPlace,
  type AyanamsaSetting,
  type EngineStamp,
} from '../../src/modules/calculation/types';

type FusionDaily = {
  sunrise: number;
  sunset: number;
  tithi_name: string;
  tithi_start_time?: number;
  tithi_end_time?: number;
  nakshatra_name: string;
  nakshatra_start_time?: number;
  nakshatra_end_time?: number;
  yoga_name: string;
  yoga_start_time?: number;
  yoga_end_time?: number;
  karana_name: string;
  karana_start_time?: number;
  karana_end_time?: number;
  vara_name: string;
  ayanamsha_value: number;
  muhurats: {
    rahu_kalam: { start: number; end: number };
    yamaganda: { start: number; end: number };
    gulika: { start: number; end: number };
  };
};

type FusionModule = {
  AyanamshaMode: { Lahiri: number; Raman: number; Krishnamurti: number };
  Location: new (latitude: number, longitude: number, altitude: number) => unknown;
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

export type FusionPanchangResult = {
  stamp: EngineStamp;
  record: NormalizedPanchang;
};

const AYANAMSA_MODE: Record<AyanamsaSetting, 'Lahiri' | 'Raman' | 'Krishnamurti'> = {
  lahiri: 'Lahiri',
  raman: 'Raman',
  krishnamurti: 'Krishnamurti',
};

function loadFusion(): FusionModule {
  // CommonJS Wasm package. A static import would pull it toward the Expo graph.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@fusionstrings/panchangam') as FusionModule;
}

function interval(
  id: string,
  name: string,
  start: number | undefined,
  end: number | undefined,
  timeZone: string,
): NamedInterval | null {
  if (typeof start !== 'number' || typeof end !== 'number' || !name.trim()) {
    return null;
  }
  return { id, name, start: formatInstant(start, timeZone), end: formatInstant(end, timeZone) };
}

/**
 * Daily Panchang from Fusion Strings. The stamp stays unverified until an
 * independent reference agrees. This does not calculate a birth chart.
 */
export function calculateFusionPanchang(
  query: PanchangQueryInput,
  fusion: FusionModule = loadFusion(),
): FusionPanchangResult {
  const placeIssues = issuesForPlace({
    latitude: query.latitude,
    longitude: query.longitude,
    elevationMeters: query.elevationMeters,
    timeZone: query.timeZone,
  });
  const ayanamsa = query.ayanamsa.id;
  const supported = ayanamsa === 'lahiri' || ayanamsa === 'raman' || ayanamsa === 'kp';
  const setting: AyanamsaSetting =
    ayanamsa === 'raman' ? 'raman' : ayanamsa === 'kp' ? 'krishnamurti' : 'lahiri';
  const stamp: EngineStamp = {
    engine: 'fusion-strings',
    engineVersion: null,
    ephemerisVersion: null,
    ayanamsa: setting,
    houseSystem: 'not-applicable',
    verification: 'unverified',
  };
  const source = {
    provider: 'fusion-strings',
    operation: 'calculate_daily_panchang',
    retrievedAt: formatInstant(Date.now(), query.timeZone),
    providerVersion: null as string | null,
  };
  if (placeIssues.length > 0 || !supported || !/^\d{4}-\d{2}-\d{2}$/.test(query.calendarDate)) {
    return {
      stamp,
      record: {
        schemaVersion: '1',
        query,
        convention: REFERENCE_CONVENTION,
        result: {
          status: 'error',
          source,
          httpStatus: 0,
          providerCode: 'invalid-input',
          message:
            placeIssues[0]?.message ?? 'The date or ayanamsa is not supported by this adapter.',
        },
      },
    };
  }
  const [year, month, day] = query.calendarDate.split('-').map(Number);
  const modeName = AYANAMSA_MODE[setting];
  const daily = fusion.calculate_daily_panchang(
    year,
    month,
    day,
    new fusion.Location(query.latitude, query.longitude, query.elevationMeters ?? 0),
    fusion.AyanamshaMode[modeName],
  );
  const version = fusion.get_version();
  const ephemeris = fusion.get_swisseph_version();
  stamp.engineVersion = version;
  stamp.ephemerisVersion = ephemeris;
  source.providerVersion = `${version} swiss-ephemeris ${ephemeris}`;
  const tithi = interval(
    'tithi',
    daily.tithi_name,
    daily.tithi_start_time,
    daily.tithi_end_time,
    query.timeZone,
  );
  const nakshatra = interval(
    'nakshatra',
    daily.nakshatra_name,
    daily.nakshatra_start_time,
    daily.nakshatra_end_time,
    query.timeZone,
  );
  const yoga = interval(
    'yoga',
    daily.yoga_name,
    daily.yoga_start_time,
    daily.yoga_end_time,
    query.timeZone,
  );
  const karana = interval(
    'karana',
    daily.karana_name,
    daily.karana_start_time,
    daily.karana_end_time,
    query.timeZone,
  );
  if (!tithi || !nakshatra || !yoga || !karana) {
    return {
      stamp,
      record: {
        schemaVersion: '1',
        query,
        convention: REFERENCE_CONVENTION,
        result: {
          status: 'error',
          source,
          httpStatus: 0,
          providerCode: 'incomplete-transition',
          message: 'The engine did not return a start and end for every anga.',
        },
      },
    };
  }
  return {
    stamp,
    record: {
      schemaVersion: '1',
      query,
      convention: REFERENCE_CONVENTION,
      result: {
        status: 'ok',
        source,
        vaara: daily.vara_name,
        sunrise: formatInstant(daily.sunrise, query.timeZone),
        sunset: formatInstant(daily.sunset, query.timeZone),
        tithi: [tithi],
        nakshatra: [nakshatra],
        yoga: [yoga],
        karana: [karana],
        rahuKaal: {
          start: formatInstant(daily.muhurats.rahu_kalam.start, query.timeZone),
          end: formatInstant(daily.muhurats.rahu_kalam.end, query.timeZone),
        },
        yamaganda: {
          start: formatInstant(daily.muhurats.yamaganda.start, query.timeZone),
          end: formatInstant(daily.muhurats.yamaganda.end, query.timeZone),
        },
        gulika: {
          start: formatInstant(daily.muhurats.gulika.start, query.timeZone),
          end: formatInstant(daily.muhurats.gulika.end, query.timeZone),
        },
      },
    },
  };
}

/** Public screens stay on the unavailable path until a reference comparison exists. */
export function panchangForDisplay(): { status: 'unavailable' } {
  return { status: 'unavailable' };
}
