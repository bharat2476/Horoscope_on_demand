import { RASHIS } from '@/modules/horoscope';
import {
  DEVELOPMENT_DAILY_EXAMPLE,
  PUBLISHED_DAILY_READINGS,
  adjacentRashi,
  issuesForPublication,
  orderRashis,
  publishDailyReading,
  readPublishedReading,
  shareHoroscopeCard,
  visibleToAnonymous,
  type DailyReading,
} from '@/modules/horoscope/daily';

function reviewed(overrides: Partial<DailyReading> = {}): DailyReading {
  return {
    ...DEVELOPMENT_DAILY_EXAMPLE,
    id: 'mesha-en-1',
    developmentExample: false,
    status: 'approved',
    createdBy: 'author-1',
    reviewerId: 'reviewer-1',
    reviewDate: '2026-10-14',
    tradition: 'Editorial suggestion',
    ...overrides,
  };
}

describe('daily Rashi readings', () => {
  it('keeps all twelve Rashis available and puts the preferred Rashi first', () => {
    expect(orderRashis(null)).toEqual(RASHIS.map((rashi) => rashi.id));
    const ordered = orderRashis('kanya');
    expect(ordered).toHaveLength(12);
    expect(new Set(ordered).size).toBe(12);
    expect(ordered[0]).toBe('kanya');
    expect(adjacentRashi('mesha', -1)).toBe('meena');
    expect(adjacentRashi('meena', 1)).toBe('mesha');
  });

  it('withholds a development example and any unpublished day', () => {
    const catalog = [DEVELOPMENT_DAILY_EXAMPLE];
    expect(PUBLISHED_DAILY_READINGS).toEqual([]);
    expect(visibleToAnonymous(catalog)).toEqual([]);
    expect(
      readPublishedReading(catalog, { date: '2026-10-15', rashiId: 'mesha', locale: 'en' }),
    ).toEqual({ status: 'missing' });
    expect(
      publishDailyReading(DEVELOPMENT_DAILY_EXAMPLE, 'reviewer-1', '2026-10-15T00:00:00Z').ok,
    ).toBe(false);
  });

  it('reads one language for one civil date and does not borrow the next day or another language', () => {
    const published = publishDailyReading(reviewed(), 'reviewer-1', '2026-10-14T08:00:00Z');
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    const catalog = [published.reading, DEVELOPMENT_DAILY_EXAMPLE];
    expect(
      readPublishedReading(catalog, { date: '2026-10-15', rashiId: 'mesha', locale: 'en' }),
    ).toEqual({
      status: 'published',
      reading: published.reading,
    });
    expect(
      readPublishedReading(catalog, { date: '2026-10-16', rashiId: 'mesha', locale: 'en' }),
    ).toEqual({
      status: 'missing',
    });
    expect(
      readPublishedReading(catalog, { date: '2026-02-29', rashiId: 'mesha', locale: 'en' }),
    ).toEqual({
      status: 'invalid-date',
    });
    expect(
      readPublishedReading(catalog, { date: '2024-02-29', rashiId: 'mesha', locale: 'en' }),
    ).toEqual({
      status: 'missing',
    });
    expect(
      readPublishedReading(catalog, { date: '2026-10-15', rashiId: 'vrishabha', locale: 'en' }),
    ).toEqual({
      status: 'missing',
    });
    expect(
      readPublishedReading(catalog, { date: '2026-10-15', rashiId: 'mesha', locale: 'hi' }),
    ).toEqual({
      status: 'missing-translation',
    });
    expect(visibleToAnonymous(catalog).map((reading) => reading.id)).toEqual(['mesha-en-1']);
    const card = shareHoroscopeCard({
      rashiLabel: 'Mesha (Aries)',
      dateLabel: '15 October 2026',
      lookup: { status: 'missing' },
      missing: 'No reviewed horoscope is published for this date.',
      missingTranslation: 'No reviewed text is published in this language for this date.',
    });
    expect(card).not.toContain('Development example');
    expect(card).toContain('No reviewed horoscope');
  });

  it('rejects a guaranteed financial claim and an unreviewed assisted draft', () => {
    const claim = reviewed({ finance: 'This Rashi guarantees returns and a stock pick.' });
    expect(
      issuesForPublication(claim, 'reviewer-1').some((issue) => issue.code === 'forbidden-claim'),
    ).toBe(true);
    const assisted = reviewed({ assistance: 'ai-draft', reviewerId: null, status: 'draft' });
    expect(
      issuesForPublication(assisted, 'reviewer-1').some(
        (issue) => issue.code === 'human-review-required',
      ),
    ).toBe(true);
    expect(
      issuesForPublication(reviewed(), 'author-1').some((issue) => issue.code === 'self-approval'),
    ).toBe(true);
  });
});
