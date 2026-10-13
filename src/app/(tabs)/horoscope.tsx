import { StyleSheet, View } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { UnavailableNotice } from '@/components/unavailable-notice';
import { Spacing } from '@/constants/theme';
import { getDailyHoroscope, RASHIS } from '@/modules/horoscope';
import { useApp } from '@/providers/app-provider';

export default function HoroscopeScreen() {
  const { rashiId, setRashiId, t } = useApp();
  const reading = getDailyHoroscope(rashiId);

  return (
    <Screen>
      {reading.status === 'unavailable' ? (
        <UnavailableNotice title={t('unavailable.title')} body={t('unavailable.horoscope')} />
      ) : null}
      <View style={styles.section}>
        <ThemedText type="title">{t('horoscope.pickerLabel')}</ThemedText>
        <ThemedText type="caption">{t('horoscope.labelNote')}</ThemedText>
        <ThemedText type="caption">
          {rashiId
            ? (RASHIS.find((rashi) => rashi.id === rashiId)?.label ?? t('horoscope.noSelection'))
            : t('horoscope.noSelection')}
        </ThemedText>
      </View>
      {RASHIS.map((rashi) => (
        <ChoiceRow
          key={rashi.id}
          label={rashi.label}
          selected={rashi.id === rashiId}
          onPress={() => setRashiId(rashi.id)}
          testID={`rashi-${rashi.id}`}
        />
      ))}
      {rashiId ? (
        <ChoiceRow label={t('horoscope.clear')} selected={false} onPress={() => setRashiId(null)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
});
