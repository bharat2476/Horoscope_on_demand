import {
  compareAnga,
  karanaFromLongitudes,
  nakshatraFromLongitude,
  signFromLongitude,
  tithiFromLongitudes,
  wholeSignHouse,
  yogaFromLongitudes,
} from '@/modules/calculation/angas';

describe('classical anga widths', () => {
  it('starts a lunar month at elongation 0', () => {
    const tithi = tithiFromLongitudes(10, 10);
    const karana = karanaFromLongitudes(10, 10);

    expect(tithi.index).toBe(1);
    expect(tithi.name).toBe('Shukla Pratipada');
    expect(karana.name).toBe('Kimstughna');
  });

  it('treats elongation 180 as the start of Krishna Pratipada', () => {
    expect(tithiFromLongitudes(0, 180).name).toBe('Krishna Pratipada');
    expect(tithiFromLongitudes(0, 179.9).name).toBe('Shukla Purnima');
  });

  it('names Amavasya in the last 12 degrees before elongation 0', () => {
    expect(tithiFromLongitudes(0, 359).name).toBe('Krishna Amavasya');
  });

  it('splits the sidereal Moon into 27 nakshatras', () => {
    expect(nakshatraFromLongitude(0).name).toBe('Ashwini');
    expect(nakshatraFromLongitude(13.4).name).toBe('Bharani');
    expect(nakshatraFromLongitude(239.9).name).toBe('Jyeshtha');
  });

  it('names yoga from the sum of the Sun and Moon', () => {
    expect(yogaFromLongitudes(178.462, 239.902).name).toBe('Shobhana');
  });

  it('maps sidereal longitude onto the twelve Rashis and whole-sign houses', () => {
    expect(signFromLongitude(178.462).id).toBe('kanya');
    expect(signFromLongitude(239.902).id).toBe('vrishchika');
    expect(wholeSignHouse(0, 7)).toBe(8);
  });

  it('allows only a one-step difference inside ten minutes of a boundary', () => {
    const counted = tithiFromLongitudes(0, 11.95);
    expect(compareAnga(1, counted, 12)).toBe('match');
    expect(compareAnga(2, counted, 12)).toBe('near');
    expect(compareAnga(3, counted, 12)).toBe('mismatch');
  });
});
