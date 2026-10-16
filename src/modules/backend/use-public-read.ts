import { useCallback, useEffect, useState } from 'react';

import { applyFetch, type CachedResult } from '@/modules/backend/cache';
import {
  loadPublishedDaily,
  loadPublishedFestivalEditions,
  loadPublishedRitualEditions,
  loadPublishedTempleEditions,
} from '@/modules/backend/public-content';
import { presentCachedPanchang, type PanchangPresentation } from '@/modules/backend/panchang-cache';
import { createPublicQuery, isSupabaseConfigured, type PublicQuery } from '@/modules/backend/query';
import { type PublishedFestival } from '@/modules/festivals';
import { type DailyReading, type RashiId } from '@/modules/horoscope';
import { type AppLocale } from '@/modules/localization';
import { type RitualRecord } from '@/modules/rituals';
import { type TempleRecord } from '@/modules/temples';

export type RemoteSection<T> = { status: 'unconfigured' } | { status: 'loading' } | CachedResult<T>;

function useRemoteSection<T>(
  key: string,
  load: (query: PublicQuery) => Promise<Parameters<typeof applyFetch<T>>[1]>,
  reloadKey: string,
): { state: RemoteSection<T>; retry: () => void } {
  const configured = isSupabaseConfigured();
  const [attempt, setAttempt] = useState(0);
  const [trackedKey, setTrackedKey] = useState(reloadKey);
  const [state, setState] = useState<RemoteSection<T>>(
    configured ? { status: 'loading' } : { status: 'unconfigured' },
  );
  if (trackedKey !== reloadKey) {
    setTrackedKey(reloadKey);
    setState(configured ? { status: 'loading' } : { status: 'unconfigured' });
  }

  useEffect(() => {
    if (!configured) {
      return;
    }
    const query = createPublicQuery();
    if (!query) {
      return;
    }
    let active = true;
    load(query).then((outcome) => {
      if (active) {
        setState(applyFetch(key, outcome, new Date().toISOString()));
      }
    });
    return () => {
      active = false;
    };
  }, [configured, attempt, key, reloadKey, load]);

  return {
    state,
    retry: () => setAttempt((current) => current + 1),
  };
}

export function useApprovedRituals(locale: AppLocale): {
  state: RemoteSection<RitualRecord[]>;
  retry: () => void;
} {
  const load = useCallback(
    (query: PublicQuery) => loadPublishedRitualEditions(query, locale),
    [locale],
  );
  return useRemoteSection(`published-ritual-editions:${locale}`, load, locale);
}

export function useApprovedTemples(locale: AppLocale): {
  state: RemoteSection<TempleRecord[]>;
  retry: () => void;
} {
  const load = useCallback(
    (query: PublicQuery) => loadPublishedTempleEditions(query, locale),
    [locale],
  );
  return useRemoteSection(`published-temple-editions:${locale}`, load, locale);
}

export function useApprovedFestivals(locale: AppLocale): {
  state: RemoteSection<PublishedFestival[]>;
  retry: () => void;
} {
  const load = useCallback(
    (query: PublicQuery) => loadPublishedFestivalEditions(query, locale),
    [locale],
  );
  return useRemoteSection(`published-festival-editions:${locale}`, load, locale);
}

export function useApprovedDaily(
  date: string,
  rashiId: RashiId | null,
): { state: RemoteSection<DailyReading[]>; retry: () => void } {
  const configured = isSupabaseConfigured();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RemoteSection<DailyReading[]>>(
    configured ? { status: 'loading' } : { status: 'unconfigured' },
  );

  useEffect(() => {
    if (!configured || !rashiId) {
      return;
    }
    const query = createPublicQuery();
    if (!query) {
      return;
    }
    let active = true;
    loadPublishedDaily(query, { date, rashiId }).then((outcome) => {
      if (active) {
        setState(applyFetch(`daily:${date}:${rashiId}`, outcome, new Date().toISOString()));
      }
    });
    return () => {
      active = false;
    };
  }, [configured, attempt, date, rashiId]);

  return {
    state: configured && !rashiId ? { status: 'empty' } : state,
    retry: () => setAttempt((current) => current + 1),
  };
}

export type RemotePanchang =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | (Exclude<PanchangPresentation, { status: 'unavailable' }> & { cached: boolean });

export function useCachedPanchang(
  cityId: string | null,
  date: string,
): { state: RemotePanchang; retry: () => void } {
  const configured = isSupabaseConfigured();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RemotePanchang>(
    configured ? { status: 'loading' } : { status: 'unconfigured' },
  );
  const visible: RemotePanchang = !configured
    ? { status: 'unconfigured' }
    : !cityId
      ? { status: 'unavailable' }
      : state;

  useEffect(() => {
    if (!configured || !cityId) {
      return;
    }
    const query = createPublicQuery();
    if (!query) {
      return;
    }
    let active = true;
    query.read('panchang_cache_public', { city_id: cityId, civil_date: date }).then((result) => {
      if (!active) {
        return;
      }
      if (result.error || !result.data) {
        const cached = applyFetch<Record<string, unknown>>(
          `panchang:${cityId}:${date}`,
          { status: 'error' },
          new Date().toISOString(),
        );
        if (cached.status === 'cached') {
          const presentation = presentCachedPanchang(cached.value, new Date());
          setState(
            presentation.status === 'unavailable'
              ? { status: 'error' }
              : { ...presentation, cached: true },
          );
          return;
        }
        setState({ status: 'error' });
        return;
      }
      const row = result.data[0] ?? null;
      const presentation = presentCachedPanchang(row, new Date());
      if (presentation.status === 'unavailable') {
        applyFetch(`panchang:${cityId}:${date}`, { status: 'empty' }, new Date().toISOString());
        setState({ status: 'unavailable' });
        return;
      }
      applyFetch(
        `panchang:${cityId}:${date}`,
        { status: 'ready', value: row as Record<string, unknown> },
        new Date().toISOString(),
      );
      setState({ ...presentation, cached: false });
    });
    return () => {
      active = false;
    };
  }, [configured, cityId, date, attempt]);

  return { state: visible, retry: () => setAttempt((current) => current + 1) };
}
