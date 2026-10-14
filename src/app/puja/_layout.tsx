import { Stack } from 'expo-router';

import { useApp } from '@/providers/app-provider';

export default function PujaLayout() {
  const { t } = useApp();
  return <Stack screenOptions={{ headerShown: true, title: t('puja.title') }} />;
}
