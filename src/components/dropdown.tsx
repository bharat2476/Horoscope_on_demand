import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

export type DropdownOption = {
  id: string;
  label: string;
};

type DropdownProps = {
  label: string;
  options: readonly DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  showLabel?: boolean;
};

export function Dropdown({
  label,
  options,
  selectedId,
  onSelect,
  placeholder,
  showLabel = true,
}: DropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === selectedId);
  const value = selected?.label ?? placeholder ?? label;

  return (
    <View style={styles.group}>
      {showLabel ? <ThemedText type="label">{label}</ThemedText> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={[styles.closed, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <ThemedText style={styles.value}>{value}</ThemedText>
        <ThemedText type="label">{open ? '▴' : '▾'}</ThemedText>
      </Pressable>
      {open ? (
        <ScrollView
          nestedScrollEnabled
          style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          {options.map((option) => {
            const active = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onSelect(option.id);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  { backgroundColor: active ? theme.tintMuted : theme.surface },
                ]}
              >
                <ThemedText themeColor={active ? 'tint' : 'text'}>{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space.sm,
  },
  closed: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  value: {
    flex: 1,
  },
  menu: {
    maxHeight: 240,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  option: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
});
