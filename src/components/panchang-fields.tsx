import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import { type ValidatedPanchang } from '@/modules/dashboard/load';

export function PanchangFields({
  value,
  tithiLabel,
  nakshatraLabel,
  sunriseLabel,
  sunsetLabel,
}: {
  value: ValidatedPanchang;
  tithiLabel: string;
  nakshatraLabel: string;
  sunriseLabel: string;
  sunsetLabel: string;
}) {
  return (
    <View style={styles.fields}>
      <ThemedText>
        {tithiLabel}: {value.tithi}
      </ThemedText>
      <ThemedText>
        {nakshatraLabel}: {value.nakshatra}
      </ThemedText>
      <ThemedText>
        {sunriseLabel}: {value.sunrise}
      </ThemedText>
      <ThemedText>
        {sunsetLabel}: {value.sunset}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: space.xs,
  },
});
