import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { createPujaGateway } from '@/modules/puja';
import { PujaReviewScreen } from '@/screens/puja-review-screen';

export default function PujaReviewRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const gateway = useMemo(() => createPujaGateway(), []);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([gateway.signedIn(), gateway.listBookings()]).then(([signedIn, bookings]) => {
      if (!active) {
        return;
      }
      setEligible(
        signedIn &&
          bookings.some(
            (booking) => booking.bookingId === bookingId && booking.status === 'completed',
          ),
      );
    });
    return () => {
      active = false;
    };
  }, [bookingId, gateway]);

  return (
    <PujaReviewScreen
      eligible={eligible}
      onSubmit={async (input) => {
        if (!bookingId) {
          return { ok: false };
        }
        const result = await gateway.submitReview({ bookingId, ...input });
        return { ok: result.ok };
      }}
    />
  );
}
