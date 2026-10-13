export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const touchTarget = 48;

export const typeScale = {
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  section: { fontSize: 18, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
} as const;

/**
 * Restrained palette: warm paper, ink, and a deep madder accent.
 * No pattern, gold gradient, or devotional illustration.
 */
export const palette = {
  light: {
    text: '#1C1917',
    textSecondary: '#5F574E',
    background: '#F7F1E8',
    surface: '#FFFCF8',
    border: '#E6D9C8',
    tint: '#7A2E2A',
    tintMuted: '#F4E6DE',
  },
  dark: {
    text: '#F6F1EA',
    textSecondary: '#C9BFB4',
    background: '#141210',
    surface: '#221E1B',
    border: '#3A342E',
    tint: '#E7B08A',
    tintMuted: '#3A2A26',
  },
} as const;

export type PaletteColor = keyof typeof palette.light;
