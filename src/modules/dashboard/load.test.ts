import { loadDashboard, readDailyPractice, type DailyPractice } from '@/modules/dashboard/load';
import { RASHIS } from '@/modules/horoscope';

describe('dashboard data', () => {
  it('returns every Rashi and no invented Panchang, mantra, festival, or temple', () => {
    const model = loadDashboard({
      date: '2026-10-15',
      locale: 'en',
      regionId: null,
      preferredRashi: 'kanya',
    });

    expect(model.rashis).toHaveLength(12);
    expect(model.rashis[0]).toBe('kanya');
    expect(new Set(model.rashis)).toEqual(new Set(RASHIS.map((rashi) => rashi.id)));
    expect(model.panchang).toEqual({ status: 'unavailable' });
    expect(model.practice).toEqual({ status: 'unavailable' });
    expect(model.festivals).toEqual({ status: 'unavailable' });
    expect(model.temples).toEqual({ status: 'unavailable' });
    expect(JSON.stringify(model)).not.toMatch(/Shukla|Rohini|Amavasya|sunrise/i);
  });

  it('does not treat another language as a completed translation', () => {
    const practice: DailyPractice = {
      id: 'practice-en',
      date: '2026-10-15',
      language: 'en',
      text: 'Reviewed English practice.',
      explanation: 'Explanation from the cited source.',
      sourceTitle: 'Editor record',
      sourceCitation: 'Record 1',
    };
    expect(readDailyPractice([practice], '2026-10-15', 'hi')).toEqual({
      status: 'missing-translation',
    });
    expect(readDailyPractice([practice], '2026-10-16', 'en')).toEqual({ status: 'unavailable' });
  });
});
