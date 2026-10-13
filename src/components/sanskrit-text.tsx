import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { preserveSanskrit, sanskritTextStyle } from '@/modules/localization/sanskrit';

type SanskritTextProps = Omit<ThemedTextProps, 'children'> & {
  children: string;
};

export function SanskritText({ children, style, ...rest }: SanskritTextProps) {
  return (
    <ThemedText accessibilityLanguage="sa" style={[sanskritTextStyle, style]} {...rest}>
      {preserveSanskrit(children)}
    </ThemedText>
  );
}
