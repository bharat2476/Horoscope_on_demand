import { useState } from 'react';

import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SearchField } from '@/components/search-field';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { stateIdForCity, type CityId } from '@/modules/places';
import { filterMatajiTemples } from '@/modules/temples';
import { useApp } from '@/providers/app-provider';

export function TemplesScreen() {
  const { cityId: savedCityId, t } = useApp();
  const [query, setQuery] = useState('');
  const [cityId, setCityId] = useState<CityId | null>(savedCityId);
  const temples = filterMatajiTemples({
    query,
    stateId: stateIdForCity(cityId),
    cityId,
  });
  const filtering = query.trim().length > 0 || cityId !== null;

  return (
    <Screen>
      <ThemedText type="caption">{t('temples.placeNote')}</ThemedText>
      <SearchField
        label={t('temples.searchLabel')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('temples.searchPlaceholder')}
        clearLabel={t('common.clear')}
      />
      <PlacePicker
        allowAll
        cityId={cityId}
        onChangeCity={setCityId}
        stateLabel={t('temples.state')}
        cityLabel={t('temples.city')}
        allLabel={t('temples.all')}
        emptyCityLabel={t('panchang.noCity')}
      />
      {temples.length === 0 ? (
        <StatusBlock
          status={filtering ? 'empty' : 'unavailable'}
          title={filtering ? t('status.emptyTitle') : t('status.unavailableTitle')}
          body={filtering ? t('temples.emptySearch') : t('unavailable.temples')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : null}
    </Screen>
  );
}
