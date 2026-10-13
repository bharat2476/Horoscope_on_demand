export const Colors = {
  light: {
    text: '#1F1A17',
    textSecondary: '#5C534C',
    background: '#FBF7F2',
    surface: '#FFFFFF',
    border: '#E4D9CC',
    tint: '#8C3A2F',
  },
  dark: {
    text: '#F6F1EA',
    textSecondary: '#C9BFB4',
    background: '#141210',
    surface: '#221E1B',
    border: '#3A342E',
    tint: '#E7B08A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;
