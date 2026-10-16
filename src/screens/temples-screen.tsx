import { useState } from 'react';

import { ChoiceRow } from '@/components/choice-row';
import { PlacePicker } from '@/components/place-picker';
import { Screen } from '@/components/screen';
import { SearchField } from '@/components/search-field';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { titleInLanguage, useApprovedTemples } from '@/modules/backend';
import { stateIdForCity, type CityId } from '@/modules/places';
import { filterMatajiTemples, filterTempleRecords } from '@/modules/temples';
import { useApp } from '@/providers/app-provider';

export function TemplesScreen({
  remote: remoteOverride,
}: {
  remote?: ReturnType<typeof useApprovedTemples>;
} = {}) {
  const { cityId: savedCityId, locale, t } = useApp();
  const loaded = useApprovedTemples(locale);
  const remote = remoteOverride ?? loaded;
  const [query, setQuery] = useState('');
  const [cityId, setCityId] = useState<CityId | null>(savedCityId);
  const filter = {
    query,
    stateId: stateIdForCity(cityId),
    cityId,
  };
  const remoteItems =
    remote.state.status === 'ready' || remote.state.status === 'cached' ? remote.state.value : [];
  const temples =
    remote.state.status === 'unconfigured'
      ? filterMatajiTemples(filter)
      : filterTempleRecords(remoteItems, filter);
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
      ) : temples.length === 0 ? (
        <StatusBlock
          status={filtering ? 'empty' : 'unavailable'}
          title={filtering ? t('status.emptyTitle') : t('status.unavailableTitle')}
          body={filtering ? t('temples.emptySearch') : t('unavailable.temples')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : (
        temples.map((temple) => (
          <ThemedText key={temple.id}>
            {titleInLanguage(temple.name, locale) ?? t('content.translationMissing')}
          </ThemedText>
        ))
      )}
    </Screen>
  );
}
