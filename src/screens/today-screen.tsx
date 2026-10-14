import { useEffect } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AdBreak } from '@/components/ad-break';
import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { VideoList } from '@/components/video-list';
import { space } from '@/design/tokens';
import { resolveAdRequest } from '@/modules/ads/request';
import { noopAnalytics } from '@/modules/analytics';
import { formatCivilDate, todayIsoDate } from '@/modules/calendar/dates';
import { getFestivalDay } from '@/modules/festivals';
import { getDailyHoroscope, RASHIS } from '@/modules/horoscope';
import { getPanchangAvailability } from '@/modules/panchang';
import { cityName, stateIdForCity } from '@/modules/places';
import { readAppEnvironment } from '@/modules/release/environment';
import { getFeaturedRitual } from '@/modules/rituals';
import { listPublishedVideos } from '@/modules/videos';
import { useApp } from '@/providers/app-provider';

export function TodayScreen() {
  const { cityId, completeOnboarding, growth, locale, rashiId, t } = useApp();
  const horoscope = getDailyHoroscope(rashiId);
  const panchang = getPanchangAvailability();
  const festival = getFestivalDay(todayIsoDate(), { locale, regionId: stateIdForCity(cityId) });
  const ritual = getFeaturedRitual();
  const rashiLabel = RASHIS.find((rashi) => rashi.id === rashiId)?.label ?? t('today.noRashi');
  const cityLabel = cityName(cityId) ?? t('today.noCity');
  const adRequest = resolveAdRequest({
    environment: readAppEnvironment(),
    ageBand: growth.ageBand,
    adChoice: growth.adChoice,
    placement: 'content-break',
  });

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
      <ThemedText>{t('today.intro')}</ThemedText>
      {growth.onboardingCompleted ? null : (
        <SectionCard title={t('onboarding.done')}>
          <ThemedText>{t('onboarding.body')}</ThemedText>
          <ChoiceRow label={t('onboarding.done')} selected={false} onPress={completeOnboarding} />
        </SectionCard>
      )}
      <View style={styles.stack}>
        <SectionCard title={t('today.horoscope')} detail={rashiLabel}>
          {horoscope.status === 'unavailable' ? (
            <StatusBlock
              status="unavailable"
              title={t('status.unavailableTitle')}
              body={t('unavailable.horoscope')}
              placeholderLabel={t('status.placeholder')}
            />
          ) : null}
          <ChoiceRow
            label={t('feedback.helpful')}
            selected={false}
            onPress={() => {
              noopAnalytics.track({
                name: 'feedback_submitted',
                properties: { kind: 'horoscope', helpful: true },
              });
            }}
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
        <SectionCard
          title={t('today.panchang')}
          detail={`${formatCivilDate(todayIsoDate(), locale)} · ${cityLabel}`}
        >
          {panchang.status === 'unavailable' ? (
            <StatusBlock
              status="unavailable"
              title={t('status.unavailableTitle')}
              body={t('unavailable.panchang')}
              placeholderLabel={t('status.placeholder')}
            />
          ) : null}
        </SectionCard>
        <SectionCard title={t('today.festival')}>
          {festival.status === 'unavailable' ? (
            <StatusBlock
              status="unavailable"
              title={t('status.unavailableTitle')}
              body={t('unavailable.festival')}
              placeholderLabel={t('status.placeholder')}
            />
          ) : (
            festival.observances.map((observance) => (
              <ThemedText key={observance.id}>
                {observance.name}. {observance.observance}
              </ThemedText>
            ))
          )}
        </SectionCard>
        <SectionCard title={t('today.ritual')}>
          {ritual.status === 'unavailable' ? (
            <StatusBlock
              status="unavailable"
              title={t('status.unavailableTitle')}
              body={t('unavailable.ritual')}
              placeholderLabel={t('status.placeholder')}
            />
          ) : null}
        </SectionCard>
        <SectionCard title={t('videos.title')}>
          <VideoList
            videos={listPublishedVideos()}
            empty={t('videos.empty')}
            note={t('videos.note')}
            openLabel={t('videos.open')}
          />
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.md,
  },
});
