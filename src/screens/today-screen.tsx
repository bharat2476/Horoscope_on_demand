import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AdBreak } from '@/components/ad-break';
import { ChoiceRow } from '@/components/choice-row';
import { PanchangFields } from '@/components/panchang-fields';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { VideoList } from '@/components/video-list';
import { space } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';
import { resolveAdRequest } from '@/modules/ads/request';
import { noopAnalytics } from '@/modules/analytics';
import { formatCivilDate, todayIsoDate } from '@/modules/calendar/dates';
import { useCalculatedPanchang, type CalculatedState } from '@/modules/calculation/use-calculated';
import { type ShownPanchang } from '@/modules/calculation/endpoint';
import { loadDashboard, type DashboardModel } from '@/modules/dashboard/load';
import { RASHIS } from '@/modules/horoscope';
import { APP_LOCALES, LOCALE_ENDONYMS, type LocalePreference } from '@/modules/localization';
import { cityName, stateIdForCity } from '@/modules/places';
import { readAppEnvironment } from '@/modules/release/environment';
import { listPublishedVideos } from '@/modules/videos';
import { useApp } from '@/providers/app-provider';

const LANGUAGE_OPTIONS: LocalePreference[] = ['system', ...APP_LOCALES];

export type DashboardLoader = (input: {
  date: string;
  locale: Parameters<typeof loadDashboard>[0]['locale'];
  regionId: string | null;
  preferredRashi: Parameters<typeof loadDashboard>[0]['preferredRashi'];
}) => DashboardModel;

export function TodayScreen({
  load = loadDashboard,
  calculated: calculatedOverride,
}: {
  load?: DashboardLoader;
  calculated?: CalculatedState<ShownPanchang>;
}) {
  const {
    cityId,
    completeOnboarding,
    growth,
    locale,
    localePreference,
    rashiId,
    ready,
    setCityId,
    setLocalePreference,
    t,
  } = useApp();
  const theme = useTheme();
  const today = todayIsoDate();
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cityLabel = cityName(cityId) ?? t('today.noCity');
  const calculatedLoad = useCalculatedPanchang(cityId, today);
  const calculated = calculatedOverride ?? calculatedLoad.state;
  const adRequest = resolveAdRequest({
    environment: readAppEnvironment(),
    ageBand: growth.ageBand,
    adChoice: growth.adChoice,
    placement: 'content-break',
  });

  const dashboard = useMemo(() => {
    void attempt;
    try {
      return {
        model: load({
          date: today,
          locale,
          regionId: stateIdForCity(cityId),
          preferredRashi: rashiId,
        }),
        failed: false,
      };
    } catch {
      return { model: null, failed: true };
    }
  }, [attempt, cityId, load, locale, rashiId, today]);
  const model = dashboard.model;
  const failed = dashboard.failed;

  useEffect(() => {
    noopAnalytics.track({ name: 'content_viewed', properties: { kind: 'horoscope' } });
    noopAnalytics.track({
      name: 'ad_result',
      properties: {
        placement: 'content-break',
        filled: adRequest.status === 'test',
        mode: adRequest.status === 'test' ? 'test' : 'unavailable',
      },
    });
  }, [adRequest.status]);

  return (
    <Screen>
      <ThemedText accessibilityRole="header">{t('dashboard.welcome')}</ThemedText>
      <ThemedText>{t('today.intro')}</ThemedText>
      <ThemedText type="caption">{formatCivilDate(today, locale)}</ThemedText>
      <ThemedText>
        {t('dashboard.language')}: {LOCALE_ENDONYMS[locale]}
      </ThemedText>
      <ThemedText>
        {t('dashboard.city')}: {cityLabel}
      </ThemedText>
      <ChoiceRow
        label={t('dashboard.showLanguages')}
        selected={languagesOpen}
        onPress={() => setLanguagesOpen((open) => !open)}
      />
      {languagesOpen
        ? LANGUAGE_OPTIONS.map((option) => (
            <ChoiceRow
              key={option}
              label={option === 'system' ? t('settings.languageSystem') : LOCALE_ENDONYMS[option]}
              selected={option === localePreference}
              onPress={() => setLocalePreference(option)}
            />
          ))
        : null}
      <ChoiceRow
        label={t('dashboard.showCities')}
        selected={citiesOpen}
        onPress={() => setCitiesOpen((open) => !open)}
      />
      {citiesOpen ? (
        <PlacePicker
          cityId={cityId}
          onChangeCity={setCityId}
          stateLabel={t('panchang.state')}
          cityLabel={t('panchang.city')}
          allLabel={t('temples.all')}
          emptyCityLabel={t('panchang.noCity')}
        />
      ) : null}
      {growth.onboardingCompleted ? null : (
        <SectionCard title={t('onboarding.done')}>
          <ThemedText>{t('onboarding.body')}</ThemedText>
          <ChoiceRow label={t('onboarding.done')} selected={false} onPress={completeOnboarding} />
        </SectionCard>
      )}
      {!ready ? <StatusBlock status="loading" title={t('status.loading')} body="" /> : null}
      {ready && failed ? (
        <StatusBlock status="error" title={t('status.errorTitle')} body={t('dashboard.error')} />
      ) : null}
      {ready && failed ? (
        <ChoiceRow
          label={t('dashboard.retry')}
          selected={false}
          onPress={() => setAttempt((value) => value + 1)}
        />
      ) : null}
      {ready && model && !failed ? (
        <View style={styles.stack}>
          <SectionCard
            title={t('dashboard.panchang')}
            detail={`${formatCivilDate(today, locale)} · ${cityLabel}`}
          >
            {calculated.status === 'accepted' ? (
              <>
                <ThemedText type="caption">{t('panchang.calculatedNotice')}</ThemedText>
                <PanchangFields
                  karanaLabel={t('panchang.karana')}
                  nakshatraLabel={t('dashboard.nakshatra')}
                  sunriseLabel={t('dashboard.sunrise')}
                  sunsetLabel={t('dashboard.sunset')}
                  tithiLabel={t('dashboard.tithi')}
                  value={calculated.value}
                  yogaLabel={t('panchang.yoga')}
                />
              </>
            ) : calculated.status === 'loading' ? (
              <StatusBlock status="loading" title={t('status.loading')} body="" />
            ) : model.panchang.status === 'ready' ? (
              <PanchangFields
                value={model.panchang}
                tithiLabel={t('dashboard.tithi')}
                nakshatraLabel={t('dashboard.nakshatra')}
                sunriseLabel={t('dashboard.sunrise')}
                sunsetLabel={t('dashboard.sunset')}
              />
            ) : (
              <StatusBlock
                status="unavailable"
                title={t('status.unavailableTitle')}
                body={t('dashboard.panchangMissing')}
              />
            )}
            <ChoiceRow
              label={t('dashboard.openPanchang')}
              selected={false}
              onPress={() => router.push('/panchang')}
            />
          </SectionCard>
          <SectionCard title={t('dashboard.guidance')} detail={t('dashboard.rashis')}>
            {model.guidance === 'unavailable' ? (
              <StatusBlock
                status="unavailable"
                title={t('status.unavailableTitle')}
                body={t('unavailable.horoscope')}
              />
            ) : null}
            <View style={styles.grid}>
              {model.rashis.map((id) => {
                const rashi = RASHIS.find((item) => item.id === id);
                if (!rashi) {
                  return null;
                }
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityLabel={rashi.label}
                    onPress={() => router.push(`/horoscope/${id}`)}
                    style={[
                      styles.cell,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                  >
                    <ThemedText>{rashi.label}</ThemedText>
                    {id === rashiId ? (
                      <ThemedText type="caption">{t('horoscope.yourRashi')}</ThemedText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <ChoiceRow
              label={t('share.label')}
              selected={false}
              onPress={() => {
                void Share.share({ message: t('share.label') });
                noopAnalytics.track({ name: 'content_shared', properties: { kind: 'horoscope' } });
              }}
            />
          </SectionCard>
          <AdBreak request={adRequest} label={t('ads.label')} body={t('ads.testBody')} />
          <SectionCard title={t('dashboard.mantra')}>
            {model.practice.status === 'ready' ? (
              <>
                <ThemedText>{model.practice.practice.text}</ThemedText>
                <ThemedText>{model.practice.practice.explanation}</ThemedText>
                <ThemedText type="caption">
                  {t('horoscope.source')}: {model.practice.practice.sourceTitle}.{' '}
                  {model.practice.practice.sourceCitation}
                </ThemedText>
              </>
            ) : (
              <StatusBlock
                status="unavailable"
                title={t('status.unavailableTitle')}
                body={
                  model.practice.status === 'missing-translation'
                    ? t('dashboard.mantraTranslationMissing')
                    : t('dashboard.mantraMissing')
                }
              />
            )}
          </SectionCard>
          <SectionCard title={t('dashboard.festivals')}>
            {model.festivals.status === 'listed' ? (
              model.festivals.observances.map((observance) => (
                <ThemedText key={observance.id}>
                  {observance.name}. {observance.observance}
                </ThemedText>
              ))
            ) : (
              <StatusBlock
                status="empty"
                title={t('status.emptyTitle')}
                body={t('dashboard.festivalsMissing')}
              />
            )}
          </SectionCard>
          <SectionCard title={t('dashboard.temples')}>
            {model.temples.status === 'listed' ? (
              model.temples.temples.map((temple) => (
                <ThemedText key={temple.id}>{temple.name[locale] ?? temple.id}</ThemedText>
              ))
            ) : (
              <StatusBlock
                status="empty"
                title={t('status.emptyTitle')}
                body={t('dashboard.templesMissing')}
              />
            )}
            <ChoiceRow
              label={t('dashboard.openTemples')}
              selected={false}
              onPress={() => router.push('/temples')}
            />
          </SectionCard>
          {model.ritual === 'unavailable' ? (
            <ThemedText type="caption">{t('unavailable.ritual')}</ThemedText>
          ) : null}
          <ChoiceRow
            label={t('dashboard.openRituals')}
            selected={false}
            onPress={() => router.push('/rituals')}
          />
          <ChoiceRow
            label={t('dashboard.openSettings')}
            selected={false}
            onPress={() => router.push('/settings')}
          />
          <SectionCard title={t('videos.title')}>
            <VideoList
              videos={listPublishedVideos()}
              empty={t('videos.empty')}
              note={t('videos.note')}
              openLabel={t('videos.open')}
            />
          </SectionCard>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  cell: {
    width: '31%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    padding: space.sm,
    justifyContent: 'center',
  },
});
