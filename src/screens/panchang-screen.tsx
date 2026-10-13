import { useState } from 'react';

import { DateStepper } from '@/components/date-stepper';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { shiftIsoDate, todayIsoDate } from '@/modules/calendar/dates';
import { getPanchangAvailability } from '@/modules/panchang';
import { useApp } from '@/providers/app-provider';

type PanchangScreenProps = {
  initialDate?: string;
};

export function PanchangScreen({ initialDate }: PanchangScreenProps) {
  const { cityId, locale, setCityId, t } = useApp();
  const [isoDate, setIsoDate] = useState(initialDate ?? todayIsoDate());
  const result = getPanchangAvailability();

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
      {result.status === 'unavailable' ? (
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
