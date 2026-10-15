import { useState } from 'react';

import { DateStepper } from '@/components/date-stepper';
import { PanchangFields } from '@/components/panchang-fields';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { ChoiceRow } from '@/components/choice-row';
import { shiftIsoDate, todayIsoDate } from '@/modules/calendar/dates';
import { useCachedPanchang, type RemotePanchang } from '@/modules/backend';
import { getPanchangAvailability } from '@/modules/panchang';
import { useApp } from '@/providers/app-provider';

type PanchangScreenProps = {
  initialDate?: string;
  remote?: { state: RemotePanchang; retry: () => void };
};

export function PanchangScreen({ initialDate, remote: remoteOverride }: PanchangScreenProps) {
  const { cityId, locale, setCityId, t } = useApp();
  const [isoDate, setIsoDate] = useState(initialDate ?? todayIsoDate());
  const loaded = useCachedPanchang(cityId, isoDate);
  const remote = remoteOverride ?? loaded;
  const offline = getPanchangAvailability();
  const shown =
    remote.state.status === 'current' || remote.state.status === 'stale' ? remote.state : null;

  return (
    <Screen>
      <ThemedText type="caption">{t('panchang.placeNote')}</ThemedText>
      <DateStepper
        isoDate={isoDate}
        language={locale}
        dateLabel={t('panchang.date')}
        previousLabel={t('panchang.previousLabel')}
        previousText={t('panchang.previous')}
        nextLabel={t('panchang.nextLabel')}
        nextText={t('panchang.next')}
        todayLabel={t('panchang.today')}
        onChange={setIsoDate}
        onPrevious={() => setIsoDate((current) => shiftIsoDate(current, -1))}
        onNext={() => setIsoDate((current) => shiftIsoDate(current, 1))}
      />
      <PlacePicker
        cityId={cityId}
        onChangeCity={setCityId}
        stateLabel={t('panchang.state')}
        cityLabel={t('panchang.city')}
        allLabel={t('temples.all')}
        emptyCityLabel={t('panchang.noCity')}
      />
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
      ) : shown ? (
        <>
          {shown.status === 'stale' || shown.cached ? (
            <ThemedText type="caption">
              {t('panchang.stale')} {shown.retrievedAt}
            </ThemedText>
          ) : null}
          <PanchangFields
            nakshatraLabel={t('dashboard.nakshatra')}
            sunriseLabel={t('dashboard.sunrise')}
            sunsetLabel={t('dashboard.sunset')}
            tithiLabel={t('dashboard.tithi')}
            value={shown.value}
          />
        </>
      ) : offline.status === 'unavailable' ? (
        <StatusBlock
          status="unavailable"
          title={t('status.unavailableTitle')}
          body={t('unavailable.panchang')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : null}
    </Screen>
  );
}
