import { palette, space } from '@/design/tokens';

export const Colors = palette;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  one: space.xs,
  two: space.sm,
  three: space.md,
  four: space.lg,
  five: space.xl,
} as const;
