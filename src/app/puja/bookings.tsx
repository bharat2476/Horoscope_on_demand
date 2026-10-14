import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { createPujaGateway, type CustomerBookingView } from '@/modules/puja';
import { PujaBookingsScreen } from '@/screens/puja-bookings-screen';

export default function PujaBookingsRoute() {
  const gateway = useMemo(() => createPujaGateway(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [bookings, setBookings] = useState<readonly CustomerBookingView[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([gateway.signedIn(), gateway.listBookings()]).then(([session, rows]) => {
      if (!active) {
        return;
      }
      setSignedIn(session);
      setBookings(rows);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return (
    <PujaBookingsScreen
      signedIn={signedIn}
      bookings={bookings}
      onJoin={(bookingId) => router.push(`/puja/session/${bookingId}`)}
      onReview={(bookingId) => router.push(`/puja/review/${bookingId}`)}
      onSavePriest={(bookingId) => {
        void gateway.savePreferredPriest(bookingId);
      }}
    />
  );
}
