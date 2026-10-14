import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import { type AdRequest } from '@/modules/ads/request';

type AdBreakProps = {
  request: AdRequest;
  label: string;
  body: string;
};

/**
 * A labeled gap between content sections. It is not pressable, so it cannot take a click.
 */
export function AdBreak({ request, label, body }: AdBreakProps) {
  if (request.status !== 'test') {
    return null;
  }

  return (
    <View accessibilityLabel={label} pointerEvents="none" style={styles.slot}>
      <ThemedText type="caption">{label}</ThemedText>
      <ThemedText type="caption">{body}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    marginVertical: space.md,
    gap: space.xs,
  },
});
