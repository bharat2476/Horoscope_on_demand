import { Share } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { formatCivilDate } from '@/modules/calendar/dates';
import { noopAnalytics } from '@/modules/analytics';
import { useApprovedDaily } from '@/modules/backend';
import {
  PUBLISHED_DAILY_READINGS,
  RASHIS,
  adjacentRashi,
  isRashiId,
  readPublishedReading,
  shareHoroscopeCard,
  type RashiId,
  type SourceType,
} from '@/modules/horoscope';
import { type AppLocale } from '@/modules/localization';
import { useApp } from '@/providers/app-provider';

const SOURCE_KEYS: Record<
  SourceType,
  | 'horoscope.source.scripture'
  | 'horoscope.source.classicalJyotish'
  | 'horoscope.source.regionalCustom'
  | 'horoscope.source.editorial'
  | 'horoscope.source.financialEducation'
> = {
  scripture: 'horoscope.source.scripture',
  'classical-jyotish': 'horoscope.source.classicalJyotish',
  'regional-custom': 'horoscope.source.regionalCustom',
  editorial: 'horoscope.source.editorial',
  'financial-education': 'horoscope.source.financialEducation',
};

export function HoroscopeScreen({
  rashiId,
  date,
  onOpenRashi,
  remote: remoteOverride,
}: {
  rashiId: string;
  date: string;
  onOpenRashi: (id: RashiId) => void;
  remote?: ReturnType<typeof useApprovedDaily>;
}) {
  const { locale, rashiId: preferredId, t } = useApp();
  const rashi = RASHIS.find((item) => item.id === rashiId);
  const valid = isRashiId(rashiId) && rashi ? rashi : null;
  const loaded = useApprovedDaily(date, valid?.id ?? null);
  const remote = remoteOverride ?? loaded;
  const catalog =
    remote.state.status === 'ready' || remote.state.status === 'cached'
      ? remote.state.value
      : PUBLISHED_DAILY_READINGS;
  const lookup = valid
    ? readPublishedReading(catalog, {
        date,
        rashiId: valid.id,
        locale: locale as AppLocale,
      })
    : { status: 'missing' as const };
  const dateLabel = formatCivilDate(date, locale);
  const statusText =
    lookup.status === 'published'
      ? t('horoscope.status.published')
      : lookup.status === 'missing-translation'
        ? t('horoscope.missingTranslation')
        : t('horoscope.missing');

  function share() {
    if (!valid) {
      return;
    }
    const message = shareHoroscopeCard({
      rashiLabel: valid.label,
      dateLabel,
      lookup,
      missing: t('horoscope.missing'),
      missingTranslation: t('horoscope.missingTranslation'),
    });
    void Share.share({ message });
    noopAnalytics.track({
      name: 'content_shared',
      properties: { kind: 'horoscope', rashiId: valid.id },
    });
  }

  return (
    <Screen>
      <SectionCard title={valid?.label ?? t('today.noRashi')} detail={dateLabel}>
        <ThemedText type="caption">
          {t('horoscope.statusLabel')}:{' '}
          {lookup.status === 'published'
            ? t('horoscope.status.published')
            : t('horoscope.status.missing')}
        </ThemedText>
        {remote.state.status === 'cached' ? (
          <ThemedText type="caption">{t('content.cachedNotice')}</ThemedText>
        ) : null}
        {remote.state.status === 'loading' ? (
          <StatusBlock status="loading" title={t('status.loading')} body="" />
        ) : remote.state.status === 'error' ? (
          <>
            <StatusBlock
              status="error"
              title={t('status.errorTitle')}
              body={t('content.loadError')}
            />
            <ChoiceRow label={t('dashboard.retry')} selected={false} onPress={remote.retry} />
          </>
        ) : lookup.status === 'published' ? (
          <>
            <ThemedText type="label">{t('horoscope.outlook')}</ThemedText>
            <ThemedText>{lookup.reading.outlook}</ThemedText>
            <ThemedText type="label">{t('horoscope.family')}</ThemedText>
            <ThemedText>{lookup.reading.family}</ThemedText>
            <ThemedText type="label">{t('horoscope.career')}</ThemedText>
            <ThemedText>{lookup.reading.career}</ThemedText>
            <ThemedText type="label">{t('horoscope.finance')}</ThemedText>
            <ThemedText>{lookup.reading.finance}</ThemedText>
            <ThemedText type="caption">{lookup.reading.financeEducation}</ThemedText>
            <ThemedText type="caption">{t('horoscope.financeNote')}</ThemedText>
            {lookup.reading.color ? (
              <>
                <ThemedText type="label">{t('horoscope.color')}</ThemedText>
                <ThemedText>{lookup.reading.color.text}</ThemedText>
              </>
            ) : null}
            {lookup.reading.observance ? (
              <>
                <ThemedText type="label">{t('horoscope.observance')}</ThemedText>
                <ThemedText>{lookup.reading.observance.originalScript}</ThemedText>
                <ThemedText>{lookup.reading.observance.transliteration}</ThemedText>
                <ThemedText>{lookup.reading.observance.meaning}</ThemedText>
              </>
            ) : null}
            {lookup.reading.seva ? (
              <>
                <ThemedText type="label">{t('horoscope.seva')}</ThemedText>
                <ThemedText>{lookup.reading.seva.text}</ThemedText>
              </>
            ) : null}
            <ThemedText type="label">{t('horoscope.action')}</ThemedText>
            <ThemedText>{lookup.reading.action}</ThemedText>
            <ThemedText type="caption">
              {t('horoscope.tradition')}: {lookup.reading.tradition}
            </ThemedText>
            {lookup.reading.sources.map((source) => (
              <ThemedText key={source.id} type="caption">
                {t('horoscope.source')}: {t(SOURCE_KEYS[source.type])}
                {source.title ? ` — ${source.title}` : ''}
                {source.citation ? ` — ${source.citation}` : ''}
              </ThemedText>
            ))}
          </>
        ) : (
          <StatusBlock
            status="unavailable"
            title={t('status.unavailableTitle')}
            body={statusText}
          />
        )}
        {valid ? (
          <>
            <ChoiceRow
              label={t('horoscope.previous')}
              selected={false}
              onPress={() => onOpenRashi(adjacentRashi(valid.id, -1))}
            />
            <ChoiceRow
              label={t('horoscope.next')}
              selected={false}
              onPress={() => onOpenRashi(adjacentRashi(valid.id, 1))}
            />
          </>
        ) : null}
        {preferredId && preferredId !== valid?.id ? (
          <ChoiceRow
            label={t('horoscope.returnSelected')}
            selected={false}
            onPress={() => onOpenRashi(preferredId)}
          />
        ) : null}
        <ChoiceRow label={t('share.label')} selected={false} onPress={share} />
      </SectionCard>
    </Screen>
  );
}
