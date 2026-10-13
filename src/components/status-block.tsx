import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

export type StatusKind = 'loading' | 'empty' | 'error' | 'unavailable';

type StatusBlockProps = {
  status: StatusKind;
  title: string;
  body: string;
  placeholderLabel?: string;
  fill?: boolean;
};

export function StatusBlock({
  status,
  title,
  body,
  placeholderLabel,
  fill = false,
}: StatusBlockProps) {
  const theme = useTheme();
  const role = status === 'loading' ? 'progressbar' : status === 'error' ? 'alert' : undefined;

  return (
    <View
      accessibilityRole={role}
      accessibilityLabel={title}
      style={[
        styles.block,
        fill && styles.fill,
        { backgroundColor: theme.tintMuted, borderColor: theme.border },
      ]}
    >
      {status === 'loading' ? <ActivityIndicator color={theme.tint} /> : null}
      {placeholderLabel && status !== 'loading' && status !== 'error' ? (
        <ThemedText type="caption">{placeholderLabel}</ThemedText>
      ) : null}
      <ThemedText type="label">{title}</ThemedText>
      {body.length > 0 ? <ThemedText>{body}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  fill: {
    flex: 1,
    justifyContent: 'center',
  },
});
