import { useMemo } from 'react';

import { ChoiceRow } from '@/components/choice-row';
import { Dropdown } from '@/components/dropdown';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
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
    growth,
    localePreference,
    notifications,
    rashiId,
    setAdChoice,
    setAgeBand,
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
  return (
    <Screen>
      <SectionCard title={t('settings.language')}>
        <Dropdown
          label={t('settings.language')}
          showLabel={false}
          selectedId={localePreference}
          onSelect={(id) => setLocalePreference(id as LocalePreference)}
          options={LANGUAGE_OPTIONS.map((option) => ({
            id: option,
            label: option === 'system' ? t('settings.languageSystem') : LOCALE_ENDONYMS[option],
          }))}
        />
        {localePreference === 'system' && suggested ? (
          <ThemedText type="caption">
            {LOCALE_ENDONYMS[suggested]}. {t('settings.languageSuggestion')}
          </ThemedText>
        ) : null}
      </SectionCard>

      <SectionCard title={t('settings.rashi')}>
        <ThemedText type="caption">{t('settings.rashiNote')}</ThemedText>
        <Dropdown
          label={t('settings.rashi')}
          showLabel={false}
          placeholder={t('settings.noRashi')}
          selectedId={rashiId ?? ''}
          onSelect={(id) => setRashiId(id as (typeof RASHIS)[number]['id'])}
          options={RASHIS.map((rashi) => ({ id: rashi.id, label: rashi.label }))}
        />
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
        <Dropdown
          label={t('settings.tradition')}
          showLabel={false}
          selectedId={traditionId ?? ''}
          onSelect={(id) => setTraditionId(id as TraditionId)}
          options={TRADITION_IDS.map((id) => ({ id, label: t(TRADITION_KEYS[id]) }))}
        />
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
        <ThemedText type="caption">{t('settings.notificationsExplain')}</ThemedText>
        <ThemedText type="caption">{t('settings.quietHours')}</ThemedText>
        <ChoiceRow
          label={t('settings.notificationsHoroscope')}
          selected={notifications.horoscope}
          onPress={() => setNotificationChannel('horoscope', !notifications.horoscope)}
        />
        <ChoiceRow
          label={t('settings.notificationsPanchang')}
          selected={notifications.panchang}
          onPress={() => setNotificationChannel('panchang', !notifications.panchang)}
        />
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

      <SectionCard title={t('ads.consentTitle')}>
        <ThemedText type="caption">{t('ads.consentBody')}</ThemedText>
        <ChoiceRow
          label={t('ads.ageConfirm')}
          selected={growth.ageBand === '18-plus'}
          onPress={() => setAgeBand('18-plus')}
        />
        <ChoiceRow
          label={t('ads.ageUnder')}
          selected={growth.ageBand === 'under-18'}
          onPress={() => setAgeBand('under-18')}
        />
        <ChoiceRow
          label={t('ads.allowNonPersonalized')}
          selected={growth.adChoice === 'non-personalized'}
          onPress={() => setAdChoice('non-personalized')}
        />
        <ChoiceRow
          label={t('ads.decline')}
          selected={growth.adChoice === 'declined'}
          onPress={() => setAdChoice('declined')}
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
