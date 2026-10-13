import {
  REFERENCE_CONVENTION,
  type NormalizedPanchang,
  type PanchangQueryInput,
} from '../../src/modules/panchang/normalized';
import { type PanchangProvider } from '../../src/modules/panchang/provider';
import { formatInstant } from '../../src/modules/panchang/time';

/** Adapters are added here only after an explicit approval. The list is empty until then. */
export const APPROVED_ADAPTERS: readonly string[] = [];

export function createApprovedProvider(id: string): PanchangProvider {
  return {
    id,
    version: null,
    fetch(query: PanchangQueryInput): Promise<NormalizedPanchang> {
      return Promise.resolve(unapproved(id, query));
    },
  };
}

function unapproved(id: string, query: PanchangQueryInput): NormalizedPanchang {
  return {
    schemaVersion: '1',
    query,
    convention: REFERENCE_CONVENTION,
    result: {
      status: 'error',
      source: {
        provider: id,
        retrievedAt: formatInstant(Date.now(), query.timeZone),
        providerVersion: null,
      },
      httpStatus: 0,
      providerCode: 'adapter-not-approved',
      message: `${id} is not an approved Panchang adapter.`,
    },
  };
}
