import { useEffect, useState } from 'react';

import {
  calculationOrigin,
  parseShownPanchang,
  parseShownTransit,
  type ShownPanchang,
  type ShownTransit,
} from '@/modules/calculation/endpoint';

export type CalculatedState<T> =
  { status: 'unavailable' } | { status: 'loading' } | { status: 'accepted'; value: T };

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    return { status: 'unavailable' };
  }
  return response.json() as Promise<unknown>;
}

function useCalculated<T>(
  url: string | null,
  parse: (value: unknown) => T | null,
): {
  state: CalculatedState<T>;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CalculatedState<T>>(
    url ? { status: 'loading' } : { status: 'unavailable' },
  );

  useEffect(() => {
    if (!url) {
      return;
    }
    let active = true;
    readJson(url)
      .then((body) => {
        if (!active) {
          return;
        }
        const value = parse(body);
        setState(value ? { status: 'accepted', value } : { status: 'unavailable' });
      })
      .catch(() => {
        if (active) {
          setState({ status: 'unavailable' });
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, parse, url]);

  return { state, retry: () => setAttempt((current) => current + 1) };
}

export function useCalculatedPanchang(
  cityId: string | null,
  date: string,
): { state: CalculatedState<ShownPanchang>; retry: () => void } {
  const origin = calculationOrigin();
  const url =
    origin && cityId
      ? `${origin}/panchang?cityId=${encodeURIComponent(cityId)}&date=${encodeURIComponent(date)}`
      : null;
  return useCalculated(url, parseShownPanchang);
}

export function useCalculatedTransit(
  cityId: string | null,
  date: string,
  rashiId: string | null,
): { state: CalculatedState<ShownTransit>; retry: () => void } {
  const origin = calculationOrigin();
  const url =
    origin && cityId && rashiId
      ? `${origin}/transit?cityId=${encodeURIComponent(cityId)}&date=${encodeURIComponent(date)}&rashiId=${encodeURIComponent(rashiId)}`
      : null;
  return useCalculated(url, parseShownTransit);
}
