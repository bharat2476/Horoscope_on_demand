import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { StatusBlock } from '@/components/status-block';
import { createPujaGateway, type PublicServiceView } from '@/modules/puja';
import { useApp } from '@/providers/app-provider';
import { PujaBookingScreen } from '@/screens/puja-booking-screen';

export default function PujaRequestRoute() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { t } = useApp();
  const gateway = useMemo(() => createPujaGateway(), []);
  const [service, setService] = useState<PublicServiceView | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([gateway.listServices(), gateway.signedIn()]).then(([services, session]) => {
      if (!active) {
        return;
      }
      setService(services.find((item) => item.id === serviceId) ?? null);
      setSignedIn(session);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [gateway, serviceId]);

  if (!ready) {
    return <StatusBlock status="loading" title={t('status.loading')} body="" />;
  }
  if (!service) {
    return (
      <StatusBlock
        status="unavailable"
        title={t('status.unavailableTitle')}
        body={t('puja.empty')}
        placeholderLabel={t('status.placeholder')}
      />
    );
  }
  return (
    <PujaBookingScreen
      service={service}
      signedIn={signedIn}
      now={new Date()}
      onSubmit={async (input) => {
        const result = await gateway.createBooking({ serviceId: service.id, ...input });
        if (result.ok) {
          router.push('/puja/bookings');
        }
        return result.ok ? { ok: true } : { ok: false, reason: result.reason };
      }}
    />
  );
}
