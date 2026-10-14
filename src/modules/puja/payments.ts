import { transitionBooking } from '@/modules/puja/transitions';
import {
  type CustomerBooking,
  type PaymentEvent,
  type StoredPaymentEvent,
} from '@/modules/puja/types';

export type PaymentDecision = {
  result: 'applied' | 'duplicate' | 'rejected';
  booking: CustomerBooking;
  stored: StoredPaymentEvent | null;
};

export function applyPaymentEvent(
  booking: CustomerBooking,
  events: readonly StoredPaymentEvent[],
  event: PaymentEvent,
): PaymentDecision {
  if (event.bookingId !== booking.id) {
    return { result: 'rejected', booking, stored: null };
  }
  const existing = events.find(
    (stored) => stored.provider === event.provider && stored.eventId === event.eventId,
  );
  if (existing) {
    return { result: 'duplicate', booking, stored: existing };
  }
  const amountMatches =
    event.amountPaise === booking.pricePaise && event.currency === booking.currency;
  if (!amountMatches) {
    return {
      result: 'rejected',
      booking,
      stored: { ...event, result: 'rejected' },
    };
  }
  const target =
    event.eventType === 'payment.captured'
      ? 'pending_assignment'
      : event.eventType === 'payment.failed'
        ? 'cancelled'
        : 'refunded';
  const moved = transitionBooking(booking.status, target, 'payment_webhook');
  if (!moved.ok) {
    return {
      result: 'rejected',
      booking,
      stored: { ...event, result: 'rejected' },
    };
  }
  return {
    result: 'applied',
    booking: { ...booking, status: moved.status },
    stored: { ...event, result: 'applied' },
  };
}
