import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/providers/app-provider';

export default function HomeScreen() {
  const { t } = useApp();
  const theme = useTheme();

  return (
    <Screen>
      <ThemedText type="title">{t('home.title')}</ThemedText>
      <ThemedText>{t('home.body')}</ThemedText>
      <ThemedView type="surface" style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText>{t('home.disclaimer')}</ThemedText>
      </ThemedView>
      <ThemedText type="caption">{t('home.policy')}</ThemedText>
      <ChoiceRow
        label={t('home.openSettings')}
        selected={false}
        onPress={() => router.push('/settings')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
});
