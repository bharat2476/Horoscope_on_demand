/**
 * @jest-environment node
 */
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  liveHttpPolicy,
  executeHttpRequest,
  IntervalLimiter,
} from '../../src/modules/panchang/http-policy';
import {
  REFERENCE_CONVENTION,
  type NormalizedPanchang,
} from '../../src/modules/panchang/normalized';
import { readProviderSecret } from './credentials';
import { createJsonTransport } from './json-transport';
import { APPROVED_ADAPTERS, createApprovedProvider } from './registry';
import { writeComparisonReport } from './run-compare';
import { loadReferenceCases, parseReferenceCase } from './store';

const secret = 'server-side-secret';

const query = {
  calendarDate: '2026-10-14',
  latitude: 23.0225,
  longitude: 72.5714,
  elevationMeters: null,
  timeZone: 'Asia/Kolkata',
  instant: '2026-10-14T12:00:00+05:30',
  ayanamsa: { id: 'lahiri' as const, providerCode: null, arcseconds: null },
  cityId: 'gj-ahmedabad',
};

function envelope(result: NormalizedPanchang['result']): NormalizedPanchang {
  return { schemaVersion: '1', query, convention: REFERENCE_CONVENTION, result };
}

function okBody(): NormalizedPanchang {
  return envelope({
    status: 'ok',
    source: {
      provider: 'remote-fixture',
      retrievedAt: '2026-10-14T12:00:00+05:30',
      providerVersion: 'remote-0',
    },
    vaara: 'fixture-vaara',
    sunrise: '2026-10-14T06:30:00+05:30',
    sunset: '2026-10-14T18:10:00+05:30',
    tithi: [
      {
        id: 'fixture-tithi',
        name: 'fixture-tithi',
        start: '2026-10-13T06:30:00+05:30',
        end: '2026-10-14T08:00:00+05:30',
      },
    ],
    nakshatra: [
      {
        id: 'fixture-nakshatra',
        name: 'fixture-nakshatra',
        start: '2026-10-13T06:30:00+05:30',
        end: '2026-10-14T09:00:00+05:30',
      },
    ],
    yoga: [
      {
        id: 'fixture-yoga',
        name: 'fixture-yoga',
        start: '2026-10-13T06:30:00+05:30',
        end: '2026-10-14T10:00:00+05:30',
      },
    ],
    karana: [
      {
        id: 'fixture-karana',
        name: 'fixture-karana',
        start: '2026-10-13T06:30:00+05:30',
        end: '2026-10-14T07:15:00+05:30',
      },
    ],
  });
}

function nodeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };
    const target = new URL(url);
    const headers =
      init.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)
        ? init.headers
        : undefined;
    const req = httpRequest(
      {
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: init.method ?? 'GET',
        headers,
      },
      (incoming: IncomingMessage) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
        incoming.on('end', () => {
          if (settled) {
            return;
          }
          settled = true;
          const headerEntries: Record<string, string> = {};
          for (const [key, value] of Object.entries(incoming.headers)) {
            if (typeof value === 'string') {
              headerEntries[key] = value;
            } else if (Array.isArray(value)) {
              headerEntries[key] = value.join(', ');
            }
          }
          resolve(
            new Response(Buffer.concat(chunks).toString('utf8'), {
              status: incoming.statusCode ?? 500,
              headers: headerEntries,
            }),
          );
        });
      },
    );
    const abort = () => {
      if (settled) {
        return;
      }
      settled = true;
      const error = new Error('The operation was aborted.');
      error.name = 'AbortError';
      req.destroy();
      reject(error);
    };
    req.on('error', () => {
      if (settled) {
        return;
      }
      if (init.signal?.aborted) {
        abort();
        return;
      }
      fail(new Error('Network request failed.'));
    });
    init.signal?.addEventListener('abort', abort);
    if (init.signal?.aborted) {
      abort();
      return;
    }
    req.end();
  });
}

function json(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  response.writeHead(status, { 'content-type': 'application/json', ...headers });
  response.end(JSON.stringify(body));
}

async function withServer(
  onRequest: (url: string, response: ServerResponse) => void,
  run: (baseUrl: string, hits: () => number) => Promise<void>,
): Promise<void> {
  let hitCount = 0;
  const server = createServer((request, response) => {
    hitCount += 1;
    onRequest(request.url ?? '/', response);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  try {
    await run(`http://127.0.0.1:${port}`, () => hitCount);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('panchang provider harness', () => {
  it('refuses a public Expo variable even when the server secret is present', () => {
    const decision = readProviderSecret({
      PANCHANG_PROVIDER_SECRET: secret,
      EXPO_PUBLIC_PANCHANG_KEY: secret,
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toContain('EXPO_PUBLIC_PANCHANG_KEY');
    }
  });

  it('does not call a network for an unapproved adapter', async () => {
    expect(APPROVED_ADAPTERS).toEqual([]);
    const provider = createApprovedProvider('prokerala');
    const result = await provider.fetch(query);
    expect(result.result).toMatchObject({
      status: 'error',
      providerCode: 'adapter-not-approved',
      httpStatus: 0,
    });
  });

  it('stores reference cases apart from provider responses and rejects a calculated pending case', async () => {
    const cases = await loadReferenceCases(path.join(process.cwd(), 'server/panchang/reference'));
    expect(cases.map((entry) => entry.id)).toEqual([
      'gj-ahmedabad-2026-10-14',
      'mh-mumbai-2026-10-14',
      'tn-chennai-2026-10-14',
      'up-varanasi-2026-10-14',
      'wb-kolkata-2026-10-14',
    ]);
    expect(
      cases.every(
        (entry) => entry.approval === 'pending' && entry.record.result.status === 'unavailable',
      ),
    ).toBe(true);

    const calculated = {
      id: 'fixture-case',
      ruleId: 'ordinary',
      approval: 'pending',
      notes: 'A provider body must not become a reference.',
      record: okBody(),
    };
    expect(() => parseReferenceCase(JSON.stringify(calculated), 'fixture-case')).toThrow(/pending/);
    expect(() =>
      parseReferenceCase(
        JSON.stringify({
          ...calculated,
          approval: 'approved',
          record: envelope({ status: 'unavailable' }),
        }),
        'fixture-case',
      ),
    ).toThrow(/no reference result/);
    expect(() =>
      parseReferenceCase(
        JSON.stringify({ ...calculated, approval: 'approved', citation: '' }),
        'fixture-case',
      ),
    ).toThrow(/citation/);
  });

  it('writes a CSV whose pending references stay missing', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'panchang-report-'));
    try {
      const csv = await writeComparisonReport(
        path.join(process.cwd(), 'server/panchang/reference'),
        path.join(process.cwd(), 'server/panchang/responses'),
        path.join(directory, 'comparison.csv'),
      );
      const saved = await readFile(path.join(directory, 'comparison.csv'), 'utf8');
      expect(saved).toBe(csv);
      expect(csv).toContain('missing');
      expect(csv).not.toContain('fixture-tithi');
      expect(csv).not.toContain(',pass,');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('returns the failed attempt instead of an earlier success or a stand-in body', async () => {
    const responses = [okBody(), { error: 'upstream failed' }];
    let index = 0;
    const transport = createJsonTransport({
      id: 'fixture-provider',
      version: 'fixture-1',
      endpoint: 'https://panchang.invalid/fixture',
      secret,
      policy: liveHttpPolicy({ timeoutMs: 50, maxRetries: 0, minIntervalMs: 0 }),
      fetchImpl: async () => {
        const body = responses[index] ?? responses[responses.length - 1];
        index += 1;
        const status = index === 1 ? 200 : 500;
        return new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    const first = await transport.fetch(query);
    const second = await transport.fetch(query);
    expect(first.result.status).toBe('ok');
    expect(second.result.status).toBe('error');
    expect(JSON.stringify(second.result)).not.toContain('fixture-tithi');
  });

  it('does not replace an invalid success body with sample Panchang data', async () => {
    const transport = createJsonTransport({
      id: 'fixture-provider',
      version: null,
      endpoint: 'https://panchang.invalid/fixture',
      secret,
      policy: liveHttpPolicy({ timeoutMs: 50, maxRetries: 0 }),
      fetchImpl: async () =>
        new Response(JSON.stringify({ note: 'not a panchang' }), { status: 200 }),
    });
    const result = await transport.fetch(query);
    expect(result.result).toMatchObject({
      status: 'error',
      providerCode: 'response-did-not-match',
    });
    expect(JSON.stringify(result.result)).not.toContain('fixture-tithi');
  });

  it('does not send a request when the server secret is absent', async () => {
    const transport = createJsonTransport({
      id: 'fixture-provider',
      version: null,
      endpoint: 'https://panchang.invalid/fixture',
      secret: null,
      policy: liveHttpPolicy(),
      fetchImpl: () => Promise.reject(new Error('network must not be called')),
    });
    const result = await transport.fetch(query);
    expect(result.result).toMatchObject({ status: 'error', providerCode: 'missing-secret' });
  });

  it('retries a rate-limit response and does not retry a rejected request', async () => {
    const sleeps: number[] = [];
    let now = 0;
    const policy = liveHttpPolicy({
      timeoutMs: 50,
      maxRetries: 2,
      minIntervalMs: 0,
      now: () => now,
      sleep: async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
    });
    const limiter = new IntervalLimiter(0, policy.now, policy.sleep);
    let limitedCalls = 0;
    const limited = await executeHttpRequest(
      { url: 'https://panchang.invalid/limited' },
      policy,
      async () => {
        limitedCalls += 1;
        if (limitedCalls === 1) {
          return new Response('slow down', { status: 429, headers: { 'retry-after': '1' } });
        }
        return new Response(JSON.stringify(okBody()), { status: 200 });
      },
      limiter,
    );
    expect(limited).toMatchObject({ ok: true, attempts: 2 });
    expect(sleeps).toEqual([1000]);

    let rejectedCalls = 0;
    const rejected = await executeHttpRequest(
      { url: 'https://panchang.invalid/rejected' },
      policy,
      async () => {
        rejectedCalls += 1;
        return new Response('bad request', { status: 400 });
      },
      new IntervalLimiter(0, policy.now, policy.sleep),
    );
    expect(rejected).toMatchObject({ ok: false, status: 400, attempts: 1 });
    expect(rejectedCalls).toBe(1);
  });

  it('spaces requests to the configured interval', async () => {
    let now = 0;
    const sleeps: number[] = [];
    const limiter = new IntervalLimiter(
      1000,
      () => now,
      async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
    );
    await limiter.wait();
    await limiter.wait();
    expect(sleeps).toEqual([1000]);
  });

  it('times out and retries against a local server, then reports the timeout', async () => {
    await withServer(
      (_url, response) => {
        setTimeout(() => {
          if (!response.writableEnded) {
            json(response, 200, okBody());
          }
        }, 400);
      },
      async (baseUrl, hits) => {
        let fetchCalls = 0;
        const transport = createJsonTransport({
          id: 'fixture-provider',
          version: 'fixture-1',
          endpoint: `${baseUrl}/slow`,
          secret,
          policy: liveHttpPolicy({ timeoutMs: 120, maxRetries: 1, minIntervalMs: 0 }),
          fetchImpl: (url, init) => {
            fetchCalls += 1;
            return nodeFetch(url, init);
          },
        });
        const result = await transport.fetch(query);
        expect(result.result).toMatchObject({ status: 'error', providerCode: 'timeout' });
        expect(JSON.stringify(result.result)).not.toContain('fixture-tithi');
        expect({ hits: hits(), fetchCalls }).toEqual({ hits: 2, fetchCalls: 2 });
      },
    );
  });

  it('reads one successful local response after an HTTP failure', async () => {
    await withServer(
      (url, response) => {
        if (url === '/fail-then-ok') {
          json(response, 503, { message: 'busy' });
          return;
        }
        json(response, 200, okBody());
      },
      async (baseUrl, hits) => {
        let route = '/fail-then-ok';
        const transport = createJsonTransport({
          id: 'fixture-provider',
          version: 'fixture-1',
          endpoint: `${baseUrl}/unused`,
          secret,
          policy: liveHttpPolicy({ timeoutMs: 200, maxRetries: 1, minIntervalMs: 0 }),
          fetchImpl: (url, init) => {
            const next = new URL(url);
            next.pathname = route;
            route = '/ok';
            return nodeFetch(next.toString(), init);
          },
        });
        const result = await transport.fetch(query);
        expect(result.result.status).toBe('ok');
        if (result.result.status === 'ok') {
          expect(result.result.source.providerVersion).toBe('fixture-1');
          expect(result.result.tithi[0]?.id).toBe('fixture-tithi');
        }
        expect(hits()).toBe(2);
      },
    );
  });

  it('keeps provider credentials out of the Android app sources', async () => {
    const roots = ['src/app', 'src/screens', 'src/providers'].map((entry) =>
      path.join(process.cwd(), entry),
    );
    const files: string[] = [path.join(process.cwd(), 'src/modules/panchang/index.ts')];
    async function walk(directory: string): Promise<void> {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
    for (const root of roots) {
      await walk(root);
    }
    const forbidden = [
      'PANCHANG_PROVIDER_SECRET',
      'EXPO_PUBLIC_PANCHANG',
      'server/panchang',
      'createJsonTransport',
    ];
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      for (const phrase of forbidden) {
        expect(source.includes(phrase)).toBe(false);
      }
    }
  });
});

describe('approved reference fixture guard', () => {
  it('accepts an approved case only with a citation and an ok result', () => {
    const approved = parseReferenceCase(
      JSON.stringify({
        id: 'fixture-approved',
        ruleId: 'ordinary',
        approval: 'approved',
        notes: 'Synthetic fixture for the loader. These names are not an astronomical reference.',
        citation: 'Test citation, not a published ephemeris.',
        record: okBody(),
      }),
      'fixture-approved',
    );
    expect(approved.approval).toBe('approved');
    expect(approved.record.result.status).toBe('ok');
  });
});
