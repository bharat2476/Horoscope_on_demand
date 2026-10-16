import { applyFetch, resetContentCache } from '@/modules/backend/cache';
import { presentCachedPanchang } from '@/modules/backend/panchang-cache';
import {
  loadPublishedDaily,
  loadPublishedFestivalEditions,
  loadPublishedFestivals,
  loadPublishedRitualEditions,
  loadPublishedRituals,
  parsePublishedDailyRow,
  parsePublishedFestival,
  parsePublishedFestivalEdition,
  parsePublishedRitual,
  parsePublishedRitualEdition,
  parsePublishedTemple,
  selectLanguageEdition,
  titleInLanguage,
} from '@/modules/backend/public-content';
import { type PublicQuery } from '@/modules/backend/query';

const now = new Date('2026-10-15T12:00:00.000Z');

const fixtureRitualRow = {
  id: 'fixture-ritual',
  body: {
    kind: 'ritual',
    category: 'home',
    title: { en: 'Fixture ritual label', hi: 'फिक्स्चर विधि' },
    language: 'en',
  },
};

function query(result: Awaited<ReturnType<PublicQuery['read']>>): PublicQuery {
  return { read: async () => result };
}

describe('public content access', () => {
  beforeEach(() => {
    resetContentCache();
  });

  it('keeps the last approved copy when a later read fails', () => {
    expect(
      applyFetch('rituals', { status: 'ready', value: ['fixture'] }, '2026-10-15T00:00:00.000Z'),
    ).toEqual({
      status: 'ready',
      value: ['fixture'],
      cached: false,
    });
    expect(applyFetch('rituals', { status: 'error' }, '2026-10-15T01:00:00.000Z')).toEqual({
      status: 'cached',
      value: ['fixture'],
      savedAt: '2026-10-15T00:00:00.000Z',
    });
    expect(applyFetch('rituals', { status: 'empty' }, '2026-10-15T02:00:00.000Z')).toEqual({
      status: 'empty',
    });
    expect(applyFetch('rituals', { status: 'error' }, '2026-10-15T03:00:00.000Z')).toEqual({
      status: 'error',
    });
  });

  it('labels an expired Panchang row as stale and drops birth details', () => {
    const payload = {
      tithi: 'Fixture tithi',
      nakshatra: 'Fixture nakshatra',
      sunrise: '06:00',
      sunset: '18:00',
    };
    expect(
      presentCachedPanchang(
        {
          payload,
          retrieved_at: '2026-10-14T00:00:00.000Z',
          expires_at: '2026-10-14T18:30:00.000Z',
          freshness: 'current',
        },
        now,
      ).status,
    ).toBe('stale');
    expect(
      presentCachedPanchang(
        {
          payload,
          retrieved_at: '2026-10-15T00:00:00.000Z',
          expires_at: '2026-10-16T00:00:00.000Z',
          freshness: 'current',
        },
        now,
      ).status,
    ).toBe('current');
    expect(
      presentCachedPanchang(
        {
          payload: { ...payload, birthDate: '2000-01-01' },
          retrieved_at: '2026-10-15T00:00:00.000Z',
          expires_at: '2026-10-16T00:00:00.000Z',
          freshness: 'current',
        },
        now,
      ),
    ).toEqual({ status: 'unavailable' });
    expect(presentCachedPanchang({ payload: { tithi: 'Fixture tithi' } }, now)).toEqual({
      status: 'unavailable',
    });
  });

  it('parses fixture rows in one language and rejects incomplete or personal rows', async () => {
    const ritual = parsePublishedRitual(fixtureRitualRow);
    expect(ritual?.title.en).toBe('Fixture ritual label');
    expect(titleInLanguage(ritual?.title ?? {}, 'hi')).toBe('फिक्स्चर विधि');
    expect(titleInLanguage(ritual?.title ?? {}, 'ta')).toBeNull();
    expect(
      parsePublishedRitual({ ...fixtureRitualRow, body: { birthDate: '2000-01-01' } }),
    ).toBeNull();
    expect(
      parsePublishedTemple({
        id: 'fixture-temple',
        body: { deity: 'Mataji', stateId: 'gj', name: { en: 'Fixture temple label' } },
      })?.name.en,
    ).toBe('Fixture temple label');
    expect(
      parsePublishedTemple({
        id: 'other',
        body: { deity: 'Other', stateId: 'gj', name: { en: 'No' } },
      }),
    ).toBeNull();

    const english = parsePublishedDailyRow({
      id: 'fixture-daily-en',
      civil_date: '2026-10-15',
      rashi_id: 'mesha',
      language: 'en',
      version: 1,
      tradition: 'Fixture tradition',
      sources: [],
      body: {
        outlook: 'Fixture outlook',
        family: 'Fixture family',
        career: 'Fixture career',
        finance: 'Fixture finance',
        financeEducation: 'Fixture finance note',
        action: 'Fixture action',
      },
    });
    const hindi = parsePublishedDailyRow({
      id: 'fixture-daily-hi',
      civil_date: '2026-10-15',
      rashi_id: 'mesha',
      language: 'hi',
      version: 1,
      tradition: 'Fixture tradition',
      sources: [],
      body: {
        outlook: 'फिक्स्चर',
        family: 'फिक्स्चर',
        career: 'फिक्स्चर',
        finance: 'फिक्स्चर',
        financeEducation: 'फिक्स्चर',
        action: 'फिक्स्चर',
      },
    });
    expect(english?.status).toBe('published');
    expect(
      selectLanguageEdition(
        [english, hindi].filter((item) => item !== null),
        'ta',
      ),
    ).toEqual({
      status: 'missing-translation',
    });
    expect(
      parsePublishedDailyRow({
        id: 'short',
        language: 'en',
        body: { outlook: 'Only one section' },
      }),
    ).toBeNull();

    const loaded = await loadPublishedRituals(query({ data: [fixtureRitualRow], error: null }));
    expect(loaded.status).toBe('ready');
    expect(await loadPublishedRituals(query({ data: [], error: null }))).toEqual({
      status: 'empty',
    });
    expect(
      await loadPublishedRituals(query({ data: null, error: { message: 'request failed' } })),
    ).toEqual({
      status: 'error',
    });
    expect(
      await loadPublishedDaily(query({ data: [], error: null }), {
        date: '2026-10-15',
        rashiId: 'mesha',
      }),
    ).toEqual({ status: 'empty' });
  });

  it('reads only the published festivals view and invents no date or reviewer note', async () => {
    const calls: { view: string; filters: Readonly<Record<string, string>> | undefined }[] = [];
    const reading: PublicQuery = {
      read: async (view, filters) => {
        calls.push({ view, filters });
        return {
          data: [
            {
              id: 'fixture-festival',
              reviewer_id: 'hidden-reviewer',
              review_date: '2026-10-01',
              published_at: '2026-10-02T00:00:00.000Z',
              body: {
                kind: 'festival',
                name: { en: 'Fixture observance' },
                language: 'en',
                regionId: null,
                observance: 'Fixture observance details.',
                calendarDate: '2026-10-16',
                convention: 'Stored date with no regional override.',
                note: 'Editorial note stays off the public row.',
                review: { reviewerId: 'hidden-reviewer' },
              },
            },
            {
              id: 'fixture-undated',
              body: {
                kind: 'festival',
                name: { en: 'Undated fixture' },
                language: 'en',
                observance: 'No stored date.',
                calendarDate: null,
                convention: 'Missing date.',
              },
            },
          ],
          error: null,
        };
      },
    };

    const loaded = await loadPublishedFestivals(reading);
    expect(calls).toEqual([{ view: 'published_festivals', filters: undefined }]);
    expect(loaded).toEqual({
      status: 'ready',
      value: [
        {
          id: 'fixture-festival',
          name: { en: 'Fixture observance' },
          language: 'en',
          regionId: null,
          observance: 'Fixture observance details.',
          calendarDate: '2026-10-16',
          convention: 'Stored date with no regional override.',
        },
      ],
    });
    expect(JSON.stringify(loaded)).not.toMatch(/hidden-reviewer|Editorial note/);
    expect(parsePublishedFestival({ id: 'draft', body: { kind: 'ritual' } })).toBeNull();
    expect(await loadPublishedFestivals(query({ data: [], error: null }))).toEqual({
      status: 'empty',
    });
    expect(
      await loadPublishedFestivals(query({ data: null, error: { message: 'request failed' } })),
    ).toEqual({ status: 'error' });
    expect(
      applyFetch(
        'published-festivals',
        { status: 'ready', value: ['fixture-festival'] },
        '2026-10-16T00:00:00.000Z',
      ),
    ).toEqual({ status: 'ready', value: ['fixture-festival'], cached: false });
    expect(
      applyFetch('published-festivals', { status: 'error' }, '2026-10-16T01:00:00.000Z'),
    ).toEqual({
      status: 'cached',
      value: ['fixture-festival'],
      savedAt: '2026-10-16T00:00:00.000Z',
    });
  });

  it('reads one published language edition and does not borrow another language', async () => {
    const calls: { view: string; filters: Readonly<Record<string, string>> | undefined }[] = [];
    const reading: PublicQuery = {
      read: async (view, filters) => {
        calls.push({ view, filters });
        return {
          data: [
            {
              id: 'fixture-festival',
              language: 'hi',
              name: 'फिक्स्चर त्योहार',
              observance: 'फिक्स्चर विवरण',
              region_id: null,
              calendar_date: '2026-10-16',
              convention: 'Stored date with no regional override.',
              reviewer_id: 'hidden-reviewer',
              note: 'Editorial note stays off the edition.',
            },
          ],
          error: null,
        };
      },
    };
    const loaded = await loadPublishedFestivalEditions(reading, 'hi');
    expect(calls).toEqual([{ view: 'published_festival_editions', filters: { language: 'hi' } }]);
    expect(loaded.status).toBe('ready');
    if (loaded.status === 'ready') {
      expect(loaded.value[0]?.name).toEqual({ hi: 'फिक्स्चर त्योहार' });
      expect(loaded.value[0]?.name.en).toBeUndefined();
      expect(JSON.stringify(loaded)).not.toMatch(/hidden-reviewer|Editorial note/);
    }
    expect(await loadPublishedFestivalEditions(query({ data: [], error: null }), 'en')).toEqual({
      status: 'empty',
    });
    expect(
      await loadPublishedFestivalEditions(
        query({ data: null, error: { message: 'request failed' } }),
        'en',
      ),
    ).toEqual({ status: 'error' });
    expect(
      parsePublishedFestivalEdition({ id: 'undated', language: 'en', name: 'No date' }),
    ).toBeNull();
    expect(
      parsePublishedRitualEdition({
        id: 'fixture-ritual',
        language: 'en',
        category: 'home',
        title: 'Fixture ritual label',
        steps: null,
        reviewer_id: 'hidden-reviewer',
      }),
    ).toEqual({
      id: 'fixture-ritual',
      category: 'home',
      title: { en: 'Fixture ritual label' },
      steps: null,
    });
    const ritualCalls: string[] = [];
    await loadPublishedRitualEditions(
      {
        read: async (view, filters) => {
          ritualCalls.push(`${view}:${filters?.language ?? ''}`);
          return { data: [], error: null };
        },
      },
      'ta',
    );
    expect(ritualCalls).toEqual(['published_ritual_editions:ta']);
  });
});
