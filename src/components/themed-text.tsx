import { Text, type TextProps } from 'react-native';

import { type ThemeColor } from '@/constants/theme';
import { typeScale } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: keyof typeof typeScale;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === 'caption' ? 'textSecondary' : 'text')];

  return <Text style={[{ color }, typeScale[type], style]} {...rest} />;
}
