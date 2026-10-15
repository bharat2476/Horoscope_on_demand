import { Stack } from 'expo-router';

import { useApp } from '@/providers/app-provider';

export default function HoroscopeLayout() {
  const { t } = useApp();
  return <Stack screenOptions={{ headerShown: true, title: t('today.horoscope') }} />;
}
