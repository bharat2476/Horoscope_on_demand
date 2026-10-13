import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget, typeScale } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

type SearchFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  clearLabel: string;
};

export function SearchField({
  label,
  value,
  onChangeText,
  placeholder,
  clearLabel,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="label">{label}</ThemedText>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
          style={[
            styles.input,
            typeScale.body,
            {
              color: theme.text,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            onPress={() => onChangeText('')}
            style={styles.clear}
          >
            <ThemedText type="label" themeColor="tint">
              {clearLabel}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  row: {
    gap: space.sm,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  clear: {
    minHeight: touchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
