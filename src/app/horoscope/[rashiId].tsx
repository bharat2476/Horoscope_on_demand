import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { todayIsoDate } from '@/modules/calendar/dates';
import { isRashiId } from '@/modules/horoscope';
import { noopAnalytics } from '@/modules/analytics';
import { HoroscopeScreen } from '@/screens/horoscope-screen';

export default function HoroscopeRoute() {
  const params = useLocalSearchParams<{ rashiId: string }>();
  const rashiId = typeof params.rashiId === 'string' ? params.rashiId : '';

  useEffect(() => {
    if (isRashiId(rashiId)) {
      noopAnalytics.track({
        name: 'content_viewed',
        properties: { kind: 'horoscope', rashiId },
      });
    }
  }, [rashiId]);

  return (
    <HoroscopeScreen
      rashiId={rashiId}
      date={todayIsoDate()}
      onOpenRashi={(id) => router.push(`/horoscope/${id}`)}
    />
  );
}
