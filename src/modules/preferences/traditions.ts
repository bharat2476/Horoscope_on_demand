export const TRADITION_IDS = ['smarta', 'vaishnava', 'shaiva', 'shakta'] as const;

export type TraditionId = (typeof TRADITION_IDS)[number];

const TRADITION_ID_SET = new Set<string>(TRADITION_IDS);

export function isTraditionId(value: unknown): value is TraditionId {
  return typeof value === 'string' && TRADITION_ID_SET.has(value);
}
