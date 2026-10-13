import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';
import { formatCivilDate, todayIsoDate } from '@/modules/calendar/dates';

type DateStepperProps = {
  isoDate: string;
  language: string;
  dateLabel: string;
  previousLabel: string;
  previousText: string;
  nextLabel: string;
  nextText: string;
  todayLabel: string;
  onChange: (isoDate: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function DateStepper({
  isoDate,
  language,
  dateLabel,
  previousLabel,
  previousText,
  nextLabel,
  nextText,
  todayLabel,
  onChange,
  onPrevious,
  onNext,
}: DateStepperProps) {
  return (
    <View style={styles.group}>
      <ThemedText type="label">{dateLabel}</ThemedText>
      <ThemedText accessibilityLiveRegion="polite">{formatCivilDate(isoDate, language)}</ThemedText>
      <View style={styles.row}>
        <DateButton label={previousLabel} text={previousText} onPress={onPrevious} />
        <DateButton label={todayLabel} text={todayLabel} onPress={() => onChange(todayIsoDate())} />
        <DateButton label={nextLabel} text={nextText} onPress={onNext} />
      </View>
    </View>
  );
}

function DateButton({
  label,
  text,
  onPress,
}: {
  label: string;
  text: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, { borderColor: theme.border, backgroundColor: theme.surface }]}
    >
      <ThemedText type="label">{text}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  button: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
  },
});
