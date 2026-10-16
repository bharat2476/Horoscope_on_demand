/**
 * @jest-environment node
 */
import { CITIES } from '@/modules/places/index';

import { acceptPanchang, acceptTransit } from './accept-day';
import { CITY_POINTS } from './city-points';

const SAMPLE_CITIES = ['gj-ahmedabad', 'mh-mumbai', 'up-varanasi', 'tn-chennai', 'wb-kolkata'];
const SAMPLE_DATES = [
  '2026-04-02',
  '2026-06-18',
  '2026-08-09',
  '2026-10-16',
  '2026-12-21',
  '2027-02-11',
];

describe('calculation acceptance', () => {
  it('pins a provisional point for every city in the picker', () => {
    expect(Object.keys(CITY_POINTS).sort()).toEqual(CITIES.map((city) => city.id).sort());
  });

  it('accepts the reference cities when classical widths and the independent longitudes agree', () => {
    const accepted = [];
    for (const cityId of SAMPLE_CITIES) {
      for (const date of SAMPLE_DATES) {
        const result = acceptPanchang(cityId, date);
        accepted.push(result);
        expect(result.status).toBe('accepted');
        if (result.status === 'accepted') {
          expect(result.ayanamsa).toBe('lahiri');
          expect(result.tithi.length).toBeGreaterThan(0);
          expect(result.nakshatra.length).toBeGreaterThan(0);
          expect(result.sunrise).toMatch(/^\d{2}:\d{2}$/);
          expect(result.sunset).toMatch(/^\d{2}:\d{2}$/);
        }
      }
    }
    const mismatches = accepted.filter((result) => result.status !== 'accepted');
    expect(mismatches).toHaveLength(0);
    expect(accepted.length).toBe(SAMPLE_CITIES.length * SAMPLE_DATES.length);
  });

  it('keeps an unknown city, a bad date, and a missing birth-style rashi off the screen', () => {
    expect(acceptPanchang('not-a-city', '2026-10-16')).toEqual({ status: 'unavailable' });
    expect(acceptPanchang('dl-new-delhi', '2026-02-31')).toEqual({ status: 'unavailable' });
    expect(acceptTransit('dl-new-delhi', '2026-10-16', 'not-a-rashi')).toEqual({
      status: 'unavailable',
    });
  });

  it('counts the whole-sign house from the requested Rashi', () => {
    const mesha = acceptTransit('dl-new-delhi', '2026-10-16', 'mesha');
    const meena = acceptTransit('dl-new-delhi', '2026-10-16', 'meena');
    expect(mesha.status).toBe('accepted');
    expect(meena.status).toBe('accepted');
    if (mesha.status === 'accepted' && meena.status === 'accepted') {
      expect(mesha.moonSignId).toBe(meena.moonSignId);
      expect(meena.moonHouse).toBe((mesha.moonHouse % 12) + 1);
      expect(mesha.engineVersion).toBe('0.2.0');
    }
  });
});
