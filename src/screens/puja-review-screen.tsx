import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget, typeScale } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';
import { REVIEW_ISSUES, type ReviewIssue } from '@/modules/puja';
import { type MessageKey } from '@/modules/localization';
import { useApp } from '@/providers/app-provider';

const ISSUE_KEYS: Record<ReviewIssue, MessageKey> = {
  late_start: 'puja.issue.late_start',
  audio: 'puja.issue.audio',
  video: 'puja.issue.video',
  ritual_concern: 'puja.issue.ritual_concern',
  conduct: 'puja.issue.conduct',
  other: 'puja.issue.other',
};

export function PujaReviewScreen({
  eligible,
  onSubmit,
}: {
  eligible: boolean;
  onSubmit: (input: {
    rating: number;
    feedback: string;
    issues: string[];
  }) => Promise<{ ok: boolean }>;
}) {
  const { t } = useApp();
  const theme = useTheme();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [issue, setIssue] = useState<ReviewIssue | null>(null);
  const [saved, setSaved] = useState(false);

  if (!eligible) {
    return (
      <Screen>
        <ThemedText>{t('puja.signIn')}</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionCard title={t('puja.review')}>
        {[1, 2, 3, 4, 5].map((value) => (
          <ChoiceRow
            key={value}
            label={`${t('puja.rating')}: ${value}`}
            selected={value === rating}
            onPress={() => setRating(value)}
          />
        ))}
        <TextInput
          accessibilityLabel={t('puja.feedback')}
          value={feedback}
          onChangeText={setFeedback}
          style={[
            styles.input,
            typeScale.body,
            { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        />
        {REVIEW_ISSUES.map((value) => (
          <ChoiceRow
            key={value}
            label={t(ISSUE_KEYS[value])}
            selected={issue === value}
            onPress={() => setIssue(value)}
          />
        ))}
        <ChoiceRow
          label={t('puja.submit')}
          selected={false}
          onPress={() => {
            void onSubmit({
              rating,
              feedback,
              issues: issue ? [issue] : [],
            }).then((result) => {
              if (result.ok) {
                setSaved(true);
                setFeedback('');
              }
            });
          }}
        />
        {saved ? <ThemedText>{t('puja.reviewSaved')}</ThemedText> : null}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
});
