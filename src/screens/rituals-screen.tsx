import { useState } from 'react';
import { router } from 'expo-router';

import { ChoiceRow } from '@/components/choice-row';
import { FilterBar } from '@/components/filter-bar';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { SearchField } from '@/components/search-field';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { titleInLanguage, useApprovedRituals } from '@/modules/backend';
import {
  RITUAL_CATEGORIES,
  filterReviewedRituals,
  filterRitualRecords,
  type RitualCategory,
} from '@/modules/rituals';
import { useApp } from '@/providers/app-provider';

const CATEGORY_KEYS = {
  daily: 'rituals.category.daily',
  vrata: 'rituals.category.vrata',
  festival: 'rituals.category.festival',
  home: 'rituals.category.home',
} as const;

export function RitualsScreen({
  onOpenLivePuja,
  remote: remoteOverride,
}: {
  onOpenLivePuja?: () => void;
  remote?: ReturnType<typeof useApprovedRituals>;
} = {}) {
  const { locale, t } = useApp();
  const loaded = useApprovedRituals();
  const remote = remoteOverride ?? loaded;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RitualCategory | 'all'>('all');
  const remoteItems =
    remote.state.status === 'ready' || remote.state.status === 'cached' ? remote.state.value : [];
  const rituals =
    remote.state.status === 'unconfigured'
      ? filterReviewedRituals({ query, category })
      : filterRitualRecords(remoteItems, { query, category });
  const filtering = query.trim().length > 0 || category !== 'all';
  const waiting = remote.state.status === 'loading';
  const failed = remote.state.status === 'error';

  return (
    <Screen>
      <SearchField
        label={t('rituals.searchLabel')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('rituals.searchPlaceholder')}
        clearLabel={t('common.clear')}
      />
      <FilterBar
        label={t('rituals.categories')}
        selectedId={category}
        onSelect={(id) => setCategory(id as RitualCategory | 'all')}
        options={[
          { id: 'all', label: t('rituals.all') },
          ...RITUAL_CATEGORIES.map((id) => ({ id, label: t(CATEGORY_KEYS[id]) })),
        ]}
      />
      <SectionCard title={t('rituals.livePuja')}>
        <ThemedText>{t('rituals.livePujaBody')}</ThemedText>
        <ChoiceRow
          label={t('puja.title')}
          selected={false}
          onPress={onOpenLivePuja ?? (() => router.push('/puja'))}
        />
      </SectionCard>
      {remote.state.status === 'cached' ? (
        <ThemedText type="caption">{t('content.cachedNotice')}</ThemedText>
      ) : null}
      {waiting ? (
        <StatusBlock status="loading" title={t('status.loading')} body="" />
      ) : failed ? (
        <>
          <StatusBlock
            status="error"
            title={t('status.errorTitle')}
            body={t('content.loadError')}
          />
          <ChoiceRow label={t('dashboard.retry')} selected={false} onPress={remote.retry} />
        </>
      ) : rituals.length === 0 ? (
        <StatusBlock
          status={filtering ? 'empty' : 'unavailable'}
          title={filtering ? t('status.emptyTitle') : t('status.unavailableTitle')}
          body={filtering ? t('rituals.emptySearch') : t('unavailable.rituals')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : (
        rituals.map((ritual) => (
          <ThemedText key={ritual.id}>
            {titleInLanguage(ritual.title, locale) ?? t('content.translationMissing')}
          </ThemedText>
        ))
      )}
    </Screen>
  );
}
