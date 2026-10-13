import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';

type SectionCardProps = {
  title: string;
  detail?: string;
  children: ReactNode;
};

export function SectionCard({ title, detail, children }: SectionCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText type="section">{title}</ThemedText>
      {detail ? <ThemedText type="caption">{detail}</ThemedText> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
});
