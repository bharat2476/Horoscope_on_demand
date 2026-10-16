import {
  issuesForBirth,
  toVedAstroStdTime,
  type BirthInput,
  type EngineStamp,
} from '../../src/modules/calculation/types';

const BASE_URL = 'https://api.vedastro.org/api';

export const VEDASTRO_CALCULATORS = [
  'AllPlanetRasiSigns',
  'PlanetNavamsaD9Sign',
  'DasaAtTime',
] as const;

export type VedAstroCalculator = (typeof VEDASTRO_CALCULATORS)[number];

export type PlanetSign = { planet: string; sign: string };

export type VedAstroResult<T> =
  { ok: true; stamp: EngineStamp; value: T } | { ok: false; code: string; message: string };

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const recentCalls: number[] = [];

export function resetVedAstroRateLimit(): void {
  recentCalls.length = 0;
}

function allowCall(now: number): boolean {
  const windowStart = now - 60_000;
  while (recentCalls.length > 0 && recentCalls[0] < windowStart) {
    recentCalls.shift();
  }
  if (recentCalls.length >= 5) {
    return false;
  }
  recentCalls.push(now);
  return true;
}

export function readVedAstroKey(
  env: Record<string, string | undefined> = process.env,
): { ok: true; key: string | null } | { ok: false; reason: string } {
  const publicName = Object.keys(env).find(
    (key) => key.startsWith('EXPO_PUBLIC_') && key.includes('VEDASTRO') && env[key],
  );
  if (publicName) {
    return { ok: false, reason: `${publicName} would be embedded in the Android bundle.` };
  }
  const key = env.VEDASTRO_API_KEY?.trim();
  return { ok: true, key: key ? key : null };
}

function stamp(): EngineStamp {
  return {
    engine: 'vedastro',
    engineVersion: null,
    ephemerisVersion: null,
    ayanamsa: 'lahiri',
    houseSystem: 'whole-sign',
    verification: 'unverified',
  };
}

export function parsePlanetRasiSigns(body: unknown): PlanetSign[] | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.Status !== 'Pass') {
    return null;
  }
  const payload = record.Payload;
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const rows = (payload as Record<string, unknown>).AllPlanetRasiSigns;
  if (!Array.isArray(rows)) {
    return null;
  }
  const planets: PlanetSign[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) {
      return null;
    }
    const item = row as Record<string, unknown>;
    if (typeof item.Planet !== 'string' || typeof item.AllPlanetRasiSigns !== 'string') {
      return null;
    }
    planets.push({ planet: item.Planet, sign: item.AllPlanetRasiSigns });
  }
  return planets.length > 0 ? planets : null;
}

export function parseDasaLord(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (record.Status !== 'Pass' || typeof record.Payload !== 'object' || record.Payload === null) {
    return null;
  }
  const dasa = (record.Payload as Record<string, unknown>).DasaAtTime;
  if (typeof dasa !== 'object' || dasa === null) {
    return null;
  }
  const lord = Object.keys(dasa)[0];
  return lord && lord.trim().length > 0 ? lord : null;
}

/**
 * Server client for documented VedAstro calculation methods.
 * Prediction endpoints are not called. Lahiri is sent on every request.
 */
export function createVedAstroClient(
  options: {
    fetchImpl?: FetchLike;
    now?: () => number;
    env?: Record<string, string | undefined>;
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  return {
    async planetRasiSigns(birth: BirthInput): Promise<VedAstroResult<readonly PlanetSign[]>> {
      const issues = issuesForBirth(birth);
      const stdTime = toVedAstroStdTime(birth);
      if (issues.length > 0 || !stdTime) {
        return {
          ok: false,
          code: issues[0]?.code ?? 'invalid-input',
          message: issues[0]?.message ?? 'Invalid birth input.',
        };
      }
      if (!allowCall(now())) {
        return {
          ok: false,
          code: 'rate-limit',
          message: 'The free VedAstro limit is 5 requests a minute.',
        };
      }
      const key = readVedAstroKey(options.env);
      if (!key.ok) {
        return { ok: false, code: 'exposed-key', message: key.reason };
      }
      const [clock, date, offset] = stdTime.split(' ');
      const [day, month, year] = (date ?? '').split('/');
      const path = `${BASE_URL}/Calculate/AllPlanetRasiSigns/Location/${birth.latitude},${birth.longitude}/Time/${clock}/${day}/${month}/${year}/${offset}/Ayanamsa/LAHIRI`;
      const headers: Record<string, string> = {};
      if (key.key) {
        headers['x-api-key'] = key.key;
      }
      let response: Response;
      try {
        response = await fetchImpl(path, { headers });
      } catch {
        return { ok: false, code: 'network', message: 'VedAstro could not be reached.' };
      }
      if (!response.ok) {
        return { ok: false, code: 'http', message: 'VedAstro returned an HTTP error.' };
      }
      const planets = parsePlanetRasiSigns(await response.json());
      if (!planets) {
        return {
          ok: false,
          code: 'unexpected-body',
          message: 'VedAstro did not return planet signs.',
        };
      }
      return { ok: true, stamp: stamp(), value: planets };
    },
  };
}
