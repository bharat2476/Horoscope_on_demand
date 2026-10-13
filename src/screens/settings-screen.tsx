import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import { createSupabaseAuthGateway } from '@/modules/authentication';
import { RASHIS } from '@/modules/horoscope';
import {
  APP_LOCALES,
  LOCALE_ENDONYMS,
  readDeviceLanguageCode,
  suggestLanguage,
  type LocalePreference,
} from '@/modules/localization';
import { TRADITION_IDS, type TraditionId } from '@/modules/preferences';
import { useApp } from '@/providers/app-provider';
import { AccountSignIn } from '@/screens/account-sign-in';

const LANGUAGE_OPTIONS: LocalePreference[] = ['system', ...APP_LOCALES];

const TRADITION_KEYS = {
  smarta: 'settings.tradition.smarta',
  vaishnava: 'settings.tradition.vaishnava',
  shaiva: 'settings.tradition.shaiva',
  shakta: 'settings.tradition.shakta',
} as const;

export function SettingsScreen() {
  const {
    authStatus,
    cityId,
    localePreference,
    notifications,
    rashiId,
    setCityId,
    setLocalePreference,
    setNotificationChannel,
    setRashiId,
    setTraditionId,
    replacePreferences,
    t,
    traditionId,
  } = useApp();
  const suggested = suggestLanguage(readDeviceLanguageCode());
  const accountGateway = useMemo(
    () => (authStatus === 'configured' ? createSupabaseAuthGateway() : null),
    [authStatus],
  );
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
        {localePreference === 'system' && suggested ? (
          <ThemedText type="caption">
            {LOCALE_ENDONYMS[suggested]}. {t('settings.languageSuggestion')}
          </ThemedText>
        ) : null}
      </SectionCard>

      <SectionCard title={t('settings.rashi')}>
        <ThemedText type="caption">{t('settings.rashiNote')}</ThemedText>
        <ThemedText type="caption">{selectedRashi}</ThemedText>
        {RASHIS.map((rashi) => (
          <ChoiceRow
            key={rashi.id}
            label={rashi.label}
            detail={rashi.sanskrit}
            detailLanguage="sa"
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
        <ThemedText type="caption">{t('settings.cityPurpose')}</ThemedText>
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

      <SectionCard title={t('settings.tradition')}>
        <ThemedText type="caption">{t('settings.traditionNote')}</ThemedText>
        {TRADITION_IDS.map((id) => (
          <ChoiceRow
            key={id}
            label={t(TRADITION_KEYS[id])}
            selected={id === traditionId}
            onPress={() => setTraditionId(id as TraditionId)}
          />
        ))}
        {traditionId ? (
          <ChoiceRow
            label={t('settings.clearTradition')}
            selected={false}
            onPress={() => setTraditionId(null)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title={t('settings.notifications')}>
        <ThemedText type="caption">{t('settings.notificationsBody')}</ThemedText>
        <ChoiceRow
          label={t('settings.notificationsFestivals')}
          selected={notifications.festivals}
          onPress={() => setNotificationChannel('festivals', !notifications.festivals)}
        />
        <ChoiceRow
          label={t('settings.notificationsRituals')}
          selected={notifications.rituals}
          onPress={() => setNotificationChannel('rituals', !notifications.rituals)}
        />
      </SectionCard>

      <SectionCard title={t('settings.privacy')}>
        <ThemedText>{t('settings.privacyBody')}</ThemedText>
        <ThemedText type="caption">{t('settings.privacyRetention')}</ThemedText>
      </SectionCard>

      <SectionCard title={t('settings.account')}>
        <ThemedText>{t('settings.accountBody')}</ThemedText>
        <ThemedText type="caption">{t('settings.migrationBody')}</ThemedText>
        {accountGateway === null ? (
          <ThemedText type="caption">{t('settings.signInUnavailable')}</ThemedText>
        ) : (
          <AccountSignIn
            gateway={accountGateway}
            preferences={{
              locale: localePreference,
              rashiId,
              cityId,
              traditionId,
              notifications,
            }}
            onPreferences={replacePreferences}
            t={t}
          />
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choices: {
    gap: space.sm,
  },
});
