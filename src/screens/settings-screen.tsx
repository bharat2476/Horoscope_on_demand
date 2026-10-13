import { StyleSheet, View } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import { RASHIS } from '@/modules/horoscope';
import { APP_LOCALES, LOCALE_ENDONYMS, type LocalePreference } from '@/modules/localization';
import { useApp } from '@/providers/app-provider';

const LANGUAGE_OPTIONS: LocalePreference[] = ['system', ...APP_LOCALES];

export function SettingsScreen() {
  const { cityId, localePreference, rashiId, setCityId, setLocalePreference, setRashiId, t } =
    useApp();
  const selectedRashi =
    RASHIS.find((rashi) => rashi.id === rashiId)?.label ?? t('settings.noRashi');

  return (
    <Screen>
      <SectionCard title={t('settings.language')}>
        <View style={styles.choices}>
          {LANGUAGE_OPTIONS.map((option) => (
            <ChoiceRow
              key={option}
              label={option === 'system' ? t('settings.languageSystem') : LOCALE_ENDONYMS[option]}
              selected={option === localePreference}
              onPress={() => setLocalePreference(option)}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard title={t('settings.rashi')}>
        <ThemedText type="caption">{t('settings.rashiNote')}</ThemedText>
        <ThemedText type="caption">{selectedRashi}</ThemedText>
        {RASHIS.map((rashi) => (
          <ChoiceRow
            key={rashi.id}
            label={rashi.label}
            selected={rashi.id === rashiId}
            onPress={() => setRashiId(rashi.id)}
          />
        ))}
        {rashiId ? (
          <ChoiceRow
            label={t('settings.clearRashi')}
            selected={false}
            onPress={() => setRashiId(null)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={t('settings.city')}>
        <ThemedText type="caption">{t('panchang.placeNote')}</ThemedText>
        <PlacePicker
          cityId={cityId}
          onChangeCity={setCityId}
          stateLabel={t('panchang.state')}
          cityLabel={t('panchang.city')}
          allLabel={t('temples.all')}
          emptyCityLabel={t('panchang.noCity')}
        />
        {cityId ? (
          <ChoiceRow
            label={t('settings.clearCity')}
            selected={false}
            onPress={() => setCityId(null)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={t('settings.privacy')}>
        <ThemedText>{t('settings.privacyBody')}</ThemedText>
      </SectionCard>

      <SectionCard title={t('settings.account')}>
        <ThemedText>{t('settings.accountBody')}</ThemedText>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choices: {
    gap: space.sm,
  },
});
