import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type UnavailableNoticeProps = {
  title: string;
  body: string;
};

export function UnavailableNotice({ title, body }: UnavailableNoticeProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.border }]}
      accessibilityRole="summary"
    >
      <ThemedText type="title">{title}</ThemedText>
      <ThemedText>{body}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
