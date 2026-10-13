import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import { formatCivilDate, todayIsoDate } from '@/modules/calendar/dates';
import { getFestivalDay } from '@/modules/festivals';
import { getDailyHoroscope, RASHIS } from '@/modules/horoscope';
import { getPanchangAvailability } from '@/modules/panchang';
import { cityName, stateIdForCity } from '@/modules/places';
import { getFeaturedRitual } from '@/modules/rituals';
import { useApp } from '@/providers/app-provider';

export function TodayScreen() {
  const { cityId, locale, rashiId, t } = useApp();
  const horoscope = getDailyHoroscope(rashiId);
  const panchang = getPanchangAvailability();
  const festival = getFestivalDay(todayIsoDate(), { locale, regionId: stateIdForCity(cityId) });
  const ritual = getFeaturedRitual();
  const rashiLabel = RASHIS.find((rashi) => rashi.id === rashiId)?.label ?? t('today.noRashi');
  const cityLabel = cityName(cityId) ?? t('today.noCity');

  return (
    <Screen>
      <ThemedText>{t('today.intro')}</ThemedText>
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
        </SectionCard>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: space.md,
  },
});
