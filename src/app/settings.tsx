import { StyleSheet, View } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { APP_LOCALES, LOCALE_ENDONYMS, type LocalePreference } from '@/modules/localization';
import { useApp } from '@/providers/app-provider';

const LANGUAGE_OPTIONS: LocalePreference[] = ['system', ...APP_LOCALES];

export default function SettingsScreen() {
  const { localePreference, setLocalePreference, t } = useApp();
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.section}>
        <ThemedText type="title">{t('settings.language')}</ThemedText>
        {LANGUAGE_OPTIONS.map((option) => (
          <ChoiceRow
            key={option}
            label={option === 'system' ? t('settings.languageSystem') : LOCALE_ENDONYMS[option]}
            selected={option === localePreference}
            onPress={() => setLocalePreference(option)}
            testID={`locale-${option}`}
          />
        ))}
      </View>
      <ThemedView type="surface" style={[styles.account, { borderColor: theme.border }]}>
        <ThemedText type="title">{t('settings.account')}</ThemedText>
        <ThemedText>{t('settings.accountBody')}</ThemedText>
        <ThemedText type="caption">{t('settings.signInUnavailable')}</ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  account: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
