import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

export type FilterOption = {
  id: string;
  label: string;
};

type FilterBarProps = {
  label: string;
  options: readonly FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function FilterBar({ label, options, selectedId, onSelect }: FilterBarProps) {
  const theme = useTheme();

  return (
    <ViewLabel label={label}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onSelect(option.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.tintMuted : theme.surface,
                  borderColor: selected ? theme.tint : theme.border,
                },
              ]}
            >
              <ThemedText type="label" themeColor={selected ? 'tint' : 'text'}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </ViewLabel>
  );
}

function ViewLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <ThemedText type="label">{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space.sm,
  },
  row: {
    gap: space.sm,
    paddingVertical: space.xs,
  },
  chip: {
    minHeight: touchTarget,
    maxWidth: 220,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
