import { useState } from 'react';
import { router } from 'expo-router';

import { ChoiceRow } from '@/components/choice-row';
import { FilterBar } from '@/components/filter-bar';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { SearchField } from '@/components/search-field';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { localizedName } from '@/modules/content';
import { RITUAL_CATEGORIES, filterReviewedRituals, type RitualCategory } from '@/modules/rituals';
import { useApp } from '@/providers/app-provider';

const CATEGORY_KEYS = {
  daily: 'rituals.category.daily',
  vrata: 'rituals.category.vrata',
  festival: 'rituals.category.festival',
  home: 'rituals.category.home',
} as const;

export function RitualsScreen({ onOpenLivePuja }: { onOpenLivePuja?: () => void } = {}) {
  const { locale, t } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RitualCategory | 'all'>('all');
  const rituals = filterReviewedRituals({ query, category });
  const filtering = query.trim().length > 0 || category !== 'all';

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
      {rituals.length === 0 ? (
        <StatusBlock
          status={filtering ? 'empty' : 'unavailable'}
          title={filtering ? t('status.emptyTitle') : t('status.unavailableTitle')}
          body={filtering ? t('rituals.emptySearch') : t('unavailable.rituals')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : (
        rituals.map((ritual) => (
          <ThemedText key={ritual.id}>
            {localizedName(ritual.title, locale) ?? ritual.id}
          </ThemedText>
        ))
      )}
    </Screen>
  );
}
