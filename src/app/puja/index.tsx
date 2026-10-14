import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { createPujaGateway, type PublicServiceView } from '@/modules/puja';
import { LivePujaCatalog } from '@/screens/live-puja-screen';

export default function LivePujaRoute() {
  const gateway = useMemo(() => createPujaGateway(), []);
  const [services, setServices] = useState<readonly PublicServiceView[]>([]);

  useEffect(() => {
    let active = true;
    gateway.listServices().then((loaded) => {
      if (active) {
        setServices(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return (
    <LivePujaCatalog
      services={services}
      configured={gateway.configured}
      onOpenService={(serviceId) => router.push(`/puja/request/${serviceId}`)}
      onOpenBookings={() => router.push('/puja/bookings')}
    />
  );
}
