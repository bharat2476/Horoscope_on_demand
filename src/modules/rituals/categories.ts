export const RITUAL_CATEGORIES = ['daily', 'vrata', 'festival', 'home'] as const;

export type RitualCategory = (typeof RITUAL_CATEGORIES)[number];
