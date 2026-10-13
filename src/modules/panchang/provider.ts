import { type NormalizedPanchang, type PanchangQueryInput } from '@/modules/panchang/normalized';

/**
 * One calculation source. The mobile app depends on this interface.
 * A new vendor is a new implementation, not a change to the screens.
 */
export interface PanchangProvider {
  readonly id: string;
  readonly version: string | null;
  fetch(query: PanchangQueryInput): Promise<NormalizedPanchang>;
}
