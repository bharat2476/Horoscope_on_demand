import { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { radius, space, touchTarget, typeScale } from '@/design/tokens';
import { useTheme } from '@/hooks/use-theme';
import {
  formatInr,
  validateBookingRequest,
  zonedWallTimeToUtc,
  type FamilyDetails,
  type LiveService,
  type PublicServiceView,
} from '@/modules/puja';
import { useApp } from '@/providers/app-provider';

function toService(view: PublicServiceView): LiveService {
  return {
    id: view.id,
    slug: view.slug,
    status: 'published',
    copy: {
      title: view.title,
      description: view.description,
      preparation: view.preparation,
    },
    pricePaise: view.pricePaise,
    currency: view.currency,
    durationMinutes: view.durationMinutes,
    languages: view.languages,
    minAdvanceHours: view.minAdvanceHours,
    requiredFamilyFields: view.requiredFamilyFields,
  };
}

export function PujaBookingScreen({
  service,
  signedIn,
  now,
  onSubmit,
}: {
  service: PublicServiceView;
  signedIn: boolean;
  now: Date;
  onSubmit: (input: {
    startsAt: string;
    timeZone: string;
    language: string;
    family: FamilyDetails;
  }) => Promise<{ ok: boolean; reason?: string }>;
}) {
  const { t } = useApp();
  const theme = useTheme();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState(service.languages[0] ?? '');
  const [householdName, setHouseholdName] = useState('');
  const [gotra, setGotra] = useState('');
  const [sankalpName, setSankalpName] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const startsAt = zonedWallTimeToUtc(date.trim(), time.trim(), timeZone.trim());
    if (!startsAt) {
      setMessage(t('puja.notOpen'));
      return;
    }
    const family: FamilyDetails = {
      householdName,
      gotra,
      sankalpName,
      nakshatra,
    };
    const decision = validateBookingRequest({
      customerId: signedIn ? 'signed-in' : null,
      service: toService(service),
      startsAt,
      timeZone: timeZone.trim(),
      language,
      family,
      sessionKind: 'private_family',
      groupPricing: false,
      now,
    });
    if (!decision.ok) {
      setMessage(reasonText(decision.reason));
      return;
    }
    const result = await onSubmit({
      startsAt: startsAt.toISOString(),
      timeZone: timeZone.trim(),
      language,
      family,
    });
    setMessage(result.ok ? t('puja.paymentNote') : reasonText(result.reason ?? 'rejected'));
  }

  function reasonText(reason: string): string {
    if (reason === 'advance_required') {
      return t('puja.advance');
    }
    if (reason === 'authentication_required') {
      return t('puja.signIn');
    }
    if (reason === 'missing_family_field') {
      return t('puja.household');
    }
    if (reason === 'invalid_timezone') {
      return t('puja.timeZone');
    }
    if (reason === 'language_unsupported') {
      return t('puja.language');
    }
    return t('status.errorBody');
  }

  const inputStyle = [
    styles.input,
    typeScale.body,
    { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
  ];

  return (
    <Screen>
      <SectionCard title={service.title} detail={formatInr(service.pricePaise)}>
        <ThemedText>{service.description}</ThemedText>
        <ThemedText type="caption">{t('puja.familyOnly')}</ThemedText>
        <ThemedText>
          {t('puja.preparation')}: {service.preparation}
        </ThemedText>
        <ThemedText type="caption">
          {t('puja.languages')}: {service.languages.join(', ')}
        </ThemedText>
        <ThemedText type="caption">
          {t('puja.advance')}: {service.minAdvanceHours}
        </ThemedText>
        <ThemedText type="caption">{t('puja.preferenceNote')}</ThemedText>
      </SectionCard>
      {signedIn ? (
        <SectionCard title={t('puja.book')}>
          <Field label={t('puja.date')} value={date} onChangeText={setDate} style={inputStyle} />
          <Field label={t('puja.clock')} value={time} onChangeText={setTime} style={inputStyle} />
          <Field
            label={t('puja.timeZone')}
            value={timeZone}
            onChangeText={setTimeZone}
            style={inputStyle}
          />
          <View style={styles.choices}>
            {service.languages.map((item) => (
              <ChoiceRow
                key={item}
                label={`${t('puja.language')}: ${item}`}
                selected={item === language}
                onPress={() => setLanguage(item)}
              />
            ))}
          </View>
          <Field
            label={t('puja.household')}
            value={householdName}
            onChangeText={setHouseholdName}
            style={inputStyle}
          />
          <Field
            label={`${t('puja.gotra')} (${t('puja.optional')})`}
            value={gotra}
            onChangeText={setGotra}
            style={inputStyle}
          />
          <Field
            label={`${t('puja.sankalp')} (${t('puja.optional')})`}
            value={sankalpName}
            onChangeText={setSankalpName}
            style={inputStyle}
          />
          <Field
            label={`${t('puja.nakshatra')} (${t('puja.optional')})`}
            value={nakshatra}
            onChangeText={setNakshatra}
            style={inputStyle}
          />
          <ChoiceRow label={t('puja.submit')} selected={false} onPress={() => void submit()} />
          {message ? <ThemedText>{message}</ThemedText> : null}
        </SectionCard>
      ) : (
        <ThemedText>{t('puja.signIn')}</ThemedText>
      )}
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  style: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="label">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        style={style}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  choices: { gap: space.sm },
});
