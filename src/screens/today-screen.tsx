import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AdBreak } from '@/components/ad-break';
import { ChoiceRow } from '@/components/choice-row';
import { Dropdown } from '@/components/dropdown';
import { PanchangFields } from '@/components/panchang-fields';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { VideoList } from '@/components/video-list';
import { space } from '@/design/tokens';
import { resolveAdRequest } from '@/modules/ads/request';
import { noopAnalytics } from '@/modules/analytics';
import { formatCivilDate, todayIsoDate } from '@/modules/calendar/dates';
import { useCalculatedPanchang, type CalculatedState } from '@/modules/calculation/use-calculated';
import { type ShownPanchang } from '@/modules/calculation/endpoint';
import { useApprovedFestivals } from '@/modules/backend';
import { loadDashboard, type DashboardModel } from '@/modules/dashboard/load';
import { listPublishedFestivalListings } from '@/modules/festivals';
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
  festivals: festivalsOverride,
}: {
  load?: DashboardLoader;
  calculated?: CalculatedState<ShownPanchang>;
  festivals?: ReturnType<typeof useApprovedFestivals>;
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
  const today = todayIsoDate();
  const [attempt, setAttempt] = useState(0);
  const cityLabel = cityName(cityId) ?? t('today.noCity');
  const calculatedLoad = useCalculatedPanchang(cityId, today);
  const calculated = calculatedOverride ?? calculatedLoad.state;
  const festivalLoad = useApprovedFestivals(locale);
  const festivals = festivalsOverride ?? festivalLoad;
  const festivalListings = useMemo(
    () =>
      festivals.state.status === 'ready' || festivals.state.status === 'cached'
        ? listPublishedFestivalListings(festivals.state.value, {
            fromDate: today,
            locale,
            regionId: stateIdForCity(cityId),
          })
        : [],
    [cityId, festivals.state, locale, today],
  );
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
      <Dropdown
        label={t('dashboard.language')}
        selectedId={localePreference}
        onSelect={(id) => setLocalePreference(id as LocalePreference)}
        options={LANGUAGE_OPTIONS.map((option) => ({
          id: option,
          label: option === 'system' ? t('settings.languageSystem') : LOCALE_ENDONYMS[option],
        }))}
      />
      <PlacePicker
        cityId={cityId}
        onChangeCity={setCityId}
        stateLabel={t('panchang.state')}
        cityLabel={t('panchang.city')}
        allLabel={t('temples.all')}
        emptyCityLabel={t('panchang.noCity')}
      />
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
            <Dropdown
              label={t('dashboard.rashis')}
              placeholder={t('today.noRashi')}
              selectedId={rashiId ?? ''}
              onSelect={(id) => router.push(`/horoscope/${id}`)}
              options={model.rashis.flatMap((id) => {
                const rashi = RASHIS.find((item) => item.id === id);
                return rashi ? [{ id, label: rashi.label }] : [];
              })}
            />
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
            {festivals.state.status === 'cached' ? (
              <ThemedText type="caption">{t('content.cachedNotice')}</ThemedText>
            ) : null}
            {festivals.state.status === 'loading' ? (
              <StatusBlock status="loading" title={t('status.loading')} body="" />
            ) : festivals.state.status === 'error' ? (
              <>
                <StatusBlock
                  status="error"
                  title={t('status.errorTitle')}
                  body={t('content.loadError')}
                />
                <ChoiceRow
                  label={t('dashboard.retry')}
                  selected={false}
                  onPress={festivals.retry}
                />
              </>
            ) : festivals.state.status === 'unconfigured' ? (
              model.festivals.status === 'listed' ? (
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
              )
            ) : festivalListings.length === 0 ? (
              <StatusBlock
                status="empty"
                title={t('status.emptyTitle')}
                body={t('dashboard.festivalsMissing')}
              />
            ) : (
              festivalListings.map((festival) => (
                <ThemedText key={festival.id}>
                  {festival.name
                    ? `${festival.name}. ${festival.observance}`
                    : t('content.translationMissing')}
                </ThemedText>
              ))
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
});
