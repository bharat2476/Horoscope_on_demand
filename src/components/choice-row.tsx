import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChoiceRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

export function ChoiceRow({ label, selected, onPress, testID }: ChoiceRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.tint : theme.border,
        },
      ]}
    >
      <ThemedText themeColor={selected ? 'tint' : 'text'}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
  },
});
