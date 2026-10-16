/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getPanchang } from '../../src/modules/panchang';
import { type PanchangQueryInput } from '../../src/modules/panchang/normalized';
import { toVedAstroStdTime, type BirthInput } from '../../src/modules/calculation/types';
import { calculateFusionPanchang, panchangForDisplay } from './fusion-strings';
import {
  createVedAstroClient,
  parseDasaLord,
  parsePlanetRasiSigns,
  readVedAstroKey,
  resetVedAstroRateLimit,
} from './vedastro';

const ahmedabad: PanchangQueryInput = {
  calendarDate: '2026-10-14',
  latitude: 23.0225,
  longitude: 72.5714,
  elevationMeters: 0,
  timeZone: 'Asia/Kolkata',
  instant: '2026-10-14T12:00:00+05:30',
  ayanamsa: { id: 'lahiri', providerCode: 1, arcseconds: null },
  cityId: 'gj-ahmedabad',
};

const vendorSampleBirth: BirthInput = {
  latitude: 19.076,
  longitude: 72.8777,
  elevationMeters: null,
  timeZone: 'Asia/Kolkata',
  date: '1992-10-25',
  time: '14:30',
  utcOffset: '+05:30',
};

/** Captured from AllPlanetRasiSigns on 16 Oct 2026. This is a parser fixture, not an accuracy reference. */
const vendorPlanetBody = {
  Status: 'Pass',
  Payload: {
    AllPlanetRasiSigns: [
      { Planet: 'Sun', AllPlanetRasiSigns: "Libra : 8° 26' 31" },
      { Planet: 'Moon', AllPlanetRasiSigns: "Libra : 1° 59' 40" },
    ],
  },
};

describe('calculation engines', () => {
  beforeEach(() => {
    resetVedAstroRateLimit();
  });

  it('runs Fusion Strings for a place and date and keeps the result unverified', () => {
    const calculated = calculateFusionPanchang(ahmedabad);
    expect(calculated.stamp).toMatchObject({
      engine: 'fusion-strings',
      ayanamsa: 'lahiri',
      verification: 'unverified',
      engineVersion: '0.2.0',
      ephemerisVersion: '2.10.03',
    });
    expect(calculated.record.result.status).toBe('ok');
    if (calculated.record.result.status !== 'ok') {
      return;
    }
    expect(Date.parse(calculated.record.result.sunrise)).toBeLessThan(
      Date.parse(calculated.record.result.sunset),
    );
    expect(calculated.record.result.tithi[0]?.name.length).toBeGreaterThan(0);
    expect(calculated.record.result.rahuKaal?.start).toBeTruthy();
    expect(panchangForDisplay()).toEqual({ status: 'unavailable' });
    expect(
      getPanchang({
        calendarDate: '2026-10-14',
        latitude: 0,
        longitude: 0,
        timeZone: 'Asia/Kolkata',
      }),
    ).toEqual({
      status: 'unavailable',
    });
  });

  it('rejects an invalid place before trusting an engine value', () => {
    const calculated = calculateFusionPanchang({ ...ahmedabad, latitude: 120 });
    expect(calculated.record.result.status).toBe('error');
    expect(calculated.stamp.verification).toBe('unverified');
  });

  it('formats VedAstro time, refuses a public key, and does not call the network for a missing birth time', async () => {
    expect(toVedAstroStdTime(vendorSampleBirth)).toBe('14:30 25/10/1992 +05:30');
    expect(toVedAstroStdTime({ ...vendorSampleBirth, time: null })).toBeNull();
    expect(readVedAstroKey({ EXPO_PUBLIC_VEDASTRO_API_KEY: 'secret' }).ok).toBe(false);
    expect(readVedAstroKey({ VEDASTRO_API_KEY: 'server-only' })).toEqual({
      ok: true,
      key: 'server-only',
    });

    const fetchImpl = jest.fn();
    const client = createVedAstroClient({ fetchImpl, env: {} });
    const missing = await client.planetRasiSigns({ ...vendorSampleBirth, time: null });
    expect(missing).toMatchObject({ ok: false, code: 'missing-birth-time' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('parses a captured VedAstro body and stops at the free-tier rate limit', async () => {
    expect(parsePlanetRasiSigns(vendorPlanetBody)?.map((row) => row.planet)).toEqual([
      'Sun',
      'Moon',
    ]);
    expect(
      parsePlanetRasiSigns({ Status: 'Fail', Payload: 'Could not parse birth time' }),
    ).toBeNull();
    expect(
      parseDasaLord({ Status: 'Pass', Payload: { DasaAtTime: { Jupiter: { Lord: 'Jupiter' } } } }),
    ).toBe('Jupiter');

    let calls = 0;
    const fetchImpl = jest.fn(async () => {
      calls += 1;
      return new Response(JSON.stringify(vendorPlanetBody), { status: 200 });
    });
    const client = createVedAstroClient({ fetchImpl, now: () => 1_000, env: {} });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await client.planetRasiSigns(vendorSampleBirth);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.stamp.verification).toBe('unverified');
        expect(result.stamp.ayanamsa).toBe('lahiri');
        expect(result.stamp.engine).toBe('vedastro');
      }
    }
    const blocked = await client.planetRasiSigns(vendorSampleBirth);
    expect(blocked).toMatchObject({ ok: false, code: 'rate-limit' });
    expect(calls).toBe(5);
    const requested = String(fetchImpl.mock.calls.at(0)?.at(0));
    expect(requested).toContain('/Ayanamsa/LAHIRI');
    expect(requested).not.toContain('HoroscopePredictions');
  });

  it('keeps chart rows private and unverified', () => {
    const sql = readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20261016120000_private_charts.sql'),
      'utf8',
    );
    expect(sql).toContain('enable row level security');
    expect(sql).toContain(
      'revoke all on chart.calculations from public, anon, authenticated, service_role',
    );
    expect(sql).toContain('verified = false');
    expect(sql).not.toMatch(/grant select on chart\.calculations to anon/i);
  });
});
