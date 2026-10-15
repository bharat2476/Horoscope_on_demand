import { useState } from 'react';
import { Image, type ImageStyle, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export const PRIEST_AVATAR_VARIANTS = ['young-adult', 'middle-aged', 'elderly'] as const;

export type PriestAvatarVariant = (typeof PRIEST_AVATAR_VARIANTS)[number];

const SOURCES = {
  'young-adult': require('../../assets/priests/young-adult.jpg'),
  'middle-aged': require('../../assets/priests/middle-aged.jpg'),
  elderly: require('../../assets/priests/elderly.jpg'),
} as const;

/**
 * Generic illustration. The variant is a drawing style, not the identity of an assigned priest.
 */
export function PriestAvatar({
  variant,
  size = 72,
  label,
  disclaimer,
}: {
  variant: PriestAvatarVariant;
  size?: number;
  label: string;
  disclaimer: string;
}) {
  const [failed, setFailed] = useState(false);
  const description = `${label}. ${disclaimer}`;
  const frame: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={styles.wrap}>
      {failed ? (
        <View
          accessibilityLabel={description}
          accessibilityRole="image"
          style={[styles.fallback, frame]}
        >
          <ThemedText type="caption">{label}</ThemedText>
        </View>
      ) : (
        <Image
          accessibilityLabel={description}
          accessibilityRole="image"
          onError={() => setFailed(true)}
          source={SOURCES[variant]}
          style={frame}
        />
      )}
      <ThemedText type="caption">{disclaimer}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    gap: 8,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
