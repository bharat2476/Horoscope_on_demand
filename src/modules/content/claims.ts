/** Minimum screen for outcome promises. A reviewer still has to read the text. */
export const FORBIDDEN_CLAIM_PATTERNS: readonly RegExp[] = [
  /guarantee[sd]?\s+(?:protection|health|wealth|money|success)/i,
  /financial success/i,
  /will\s+(?:cure|heal)\b/i,
  /removes?\s+all\s+(?:dosha|obstacles|sins)/i,
];

const SCRIPTURE_MENTIONS: readonly RegExp[] = [
  /bhagavad\s*gita/i,
  /rig\s*veda/i,
  /yajur\s*veda/i,
  /sama\s*veda/i,
  /atharva\s*veda/i,
  /\bramayana\b/i,
  /\bmahabharata\b/i,
  /\bupanishad/i,
  /\bpurana\b/i,
];

export function findForbiddenClaim(text: string): string | null {
  const match = FORBIDDEN_CLAIM_PATTERNS.find((pattern) => pattern.test(text));
  return match ? match.source : null;
}

export function mentionsScripture(text: string): boolean {
  return SCRIPTURE_MENTIONS.some((pattern) => pattern.test(text));
}

export function collectText(value: unknown, skip: ReadonlySet<string> = new Set()): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, skip));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) =>
      skip.has(key) ? [] : collectText(item, skip),
    );
  }
  return [];
}
