import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';

export function PanchangFields({
  value,
  tithiLabel,
  nakshatraLabel,
  sunriseLabel,
  sunsetLabel,
  yogaLabel,
  karanaLabel,
}: {
  value: {
    tithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
    yoga?: string;
    karana?: string;
  };
  tithiLabel: string;
  nakshatraLabel: string;
  sunriseLabel: string;
  sunsetLabel: string;
  yogaLabel?: string;
  karanaLabel?: string;
}) {
  return (
    <View style={styles.fields}>
      <ThemedText>
        {tithiLabel}: {value.tithi}
      </ThemedText>
      <ThemedText>
        {nakshatraLabel}: {value.nakshatra}
      </ThemedText>
      {yogaLabel && value.yoga ? (
        <ThemedText>
          {yogaLabel}: {value.yoga}
        </ThemedText>
      ) : null}
      {karanaLabel && value.karana ? (
        <ThemedText>
          {karanaLabel}: {value.karana}
        </ThemedText>
      ) : null}
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
