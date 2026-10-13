const DEVANAGARI = /[\u0900-\u097F]/;

/** Keeps Sanskrit in Unicode NFC. It does not transliterate Devanagari into Latin letters. */
export function preserveSanskrit(value: string): string {
  return value.normalize('NFC');
}

export function hasDevanagari(value: string): boolean {
  return DEVANAGARI.test(value);
}

export const sanskritTextStyle = {
  fontStyle: 'normal' as const,
  textTransform: 'none' as const,
};
