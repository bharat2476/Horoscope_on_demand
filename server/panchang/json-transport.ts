import {
  IntervalLimiter,
  executeHttpRequest,
  type FetchLike,
  type HttpPolicy,
} from '../../src/modules/panchang/http-policy';
import {
  REFERENCE_CONVENTION,
  type NormalizedPanchang,
  type PanchangQueryInput,
  type PanchangSource,
} from '../../src/modules/panchang/normalized';
import { parseNormalizedPanchang } from '../../src/modules/panchang/parse-record';
import { type PanchangProvider } from '../../src/modules/panchang/provider';
import { formatInstant } from '../../src/modules/panchang/time';

export type JsonTransportOptions = {
  id: string;
  version: string | null;
  endpoint: string;
  secret: string | null;
  policy: HttpPolicy;
  fetchImpl: FetchLike;
};

/**
 * Sends one request and returns that attempt's outcome.
 * A failed attempt does not reuse an earlier success or a fixture.
 */
export function createJsonTransport(options: JsonTransportOptions): PanchangProvider {
  const limiter = new IntervalLimiter(
    options.policy.minIntervalMs,
    options.policy.now,
    options.policy.sleep,
  );
  return {
    id: options.id,
    version: options.version,
    async fetch(query: PanchangQueryInput): Promise<NormalizedPanchang> {
      const source = retrievalSource(options, query);
      if (!options.secret) {
        return errorRecord(
          query,
          source,
          0,
          'missing-secret',
          'Provider secret is not available to this service.',
        );
      }
      const outcome = await executeHttpRequest(
        {
          url: options.endpoint,
          headers: { authorization: `Bearer ${options.secret}`, accept: 'application/json' },
        },
        options.policy,
        options.fetchImpl,
        limiter,
      );
      if (!outcome.ok) {
        return errorRecord(query, source, outcome.status ?? 0, outcome.error, outcome.message);
      }
      const parsed = parseNormalizedPanchang(outcome.body);
      if (!parsed.ok) {
        return errorRecord(
          query,
          source,
          outcome.status,
          'response-did-not-match',
          `Response is missing ${parsed.missing.join(', ')}.`,
        );
      }
      if (parsed.record.query.calendarDate !== query.calendarDate) {
        return errorRecord(
          query,
          source,
          outcome.status,
          'response-query-mismatch',
          'Response calendar date does not match the request.',
        );
      }
      if (parsed.record.result.status === 'ok') {
        return {
          schemaVersion: '1',
          query,
          convention: parsed.record.convention,
          result: { ...parsed.record.result, source },
        };
      }
      if (parsed.record.result.status === 'error') {
        return {
          schemaVersion: '1',
          query,
          convention: parsed.record.convention,
          result: { ...parsed.record.result, source },
        };
      }
      return {
        schemaVersion: '1',
        query,
        convention: parsed.record.convention,
        result: parsed.record.result,
      };
    },
  };
}

function retrievalSource(options: JsonTransportOptions, query: PanchangQueryInput): PanchangSource {
  return {
    provider: options.id,
    operation: options.endpoint,
    retrievedAt: formatInstant(options.policy.now(), query.timeZone),
    providerVersion: options.version,
  };
}

function errorRecord(
  query: PanchangQueryInput,
  source: PanchangSource,
  httpStatus: number,
  providerCode: string,
  message: string,
): NormalizedPanchang {
  return {
    schemaVersion: '1',
    query,
    convention: REFERENCE_CONVENTION,
    result: {
      status: 'error',
      source,
      httpStatus,
      providerCode,
      message,
    },
  };
}
