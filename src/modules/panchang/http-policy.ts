export type HttpMethod = 'GET';

export type HttpRequest = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
};

export type HttpOutcome =
  | { ok: true; status: number; body: unknown; attempts: number }
  | {
      ok: false;
      status: number | null;
      error: 'timeout' | 'http' | 'network';
      message: string;
      attempts: number;
    };

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type HttpPolicy = {
  timeoutMs: number;
  maxRetries: number;
  retryStatuses: readonly number[];
  minIntervalMs: number;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

export function liveHttpPolicy(overrides: Partial<HttpPolicy> = {}): HttpPolicy {
  return {
    timeoutMs: 10_000,
    maxRetries: 2,
    retryStatuses: [429, 503],
    minIntervalMs: 0,
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    ...overrides,
  };
}

/**
 * One attempt's body is returned only when that attempt succeeds.
 * A later failure does not reuse an earlier success, and a failure has no body.
 */
export async function executeHttpRequest(
  request: HttpRequest,
  policy: HttpPolicy,
  fetchImpl: FetchLike,
  limiter: IntervalLimiter,
): Promise<HttpOutcome> {
  const attemptsAllowed = policy.maxRetries + 1;
  let lastFailure: HttpOutcome | null = null;

  for (let attempt = 1; attempt <= attemptsAllowed; attempt += 1) {
    await limiter.wait();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    try {
      const response = await fetchImpl(request.url, {
        method: request.method ?? 'GET',
        headers: request.headers,
        signal: controller.signal,
      });
      if (response.ok) {
        const body: unknown = await response.json();
        return { ok: true, status: response.status, body, attempts: attempt };
      }
      const message = await safeText(response);
      lastFailure = {
        ok: false,
        status: response.status,
        error: 'http',
        message,
        attempts: attempt,
      };
      if (!policy.retryStatuses.includes(response.status) || attempt === attemptsAllowed) {
        return lastFailure;
      }
      const retryAfter = retryAfterMs(response);
      if (retryAfter > 0) {
        await policy.sleep(retryAfter);
      }
    } catch (error) {
      const timedOut = isAbort(error);
      lastFailure = {
        ok: false,
        status: null,
        error: timedOut ? 'timeout' : 'network',
        message: timedOut ? 'Request timed out.' : errorMessage(error),
        attempts: attempt,
      };
      if (!timedOut || attempt === attemptsAllowed) {
        return lastFailure;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    lastFailure ?? {
      ok: false,
      status: null,
      error: 'network',
      message: 'Request was not sent.',
      attempts: 0,
    }
  );
}

export class IntervalLimiter {
  private nextAllowed = 0;

  constructor(
    private readonly minIntervalMs: number,
    private readonly now: () => number,
    private readonly sleep: (ms: number) => Promise<void>,
  ) {}

  async wait(): Promise<void> {
    const delay = this.nextAllowed - this.now();
    if (delay > 0) {
      await this.sleep(delay);
    }
    this.nextAllowed = this.now() + this.minIntervalMs;
  }
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get('retry-after');
  if (!header) {
    return 0;
  }
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }
  return seconds * 1000;
}

async function safeText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return typeof text === 'string' ? text : '';
  } catch {
    return '';
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Network request failed.';
}
