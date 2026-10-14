import { type ActorKind, type BookingStatus } from '@/modules/puja/types';

const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, readonly ActorKind[]>>> = {
  pending_payment: {
    pending_assignment: ['payment_webhook', 'admin'],
    cancelled: ['customer', 'admin', 'payment_webhook'],
  },
  pending_assignment: {
    confirmed: ['system', 'admin'],
    cancelled: ['customer', 'admin'],
    refund_pending: ['admin', 'system'],
  },
  confirmed: {
    rescheduled: ['customer', 'admin', 'priest'],
    cancelled: ['customer', 'admin'],
    in_progress: ['priest', 'admin', 'system'],
    no_show: ['priest', 'admin'],
    refund_pending: ['admin'],
  },
  rescheduled: {
    confirmed: ['system', 'admin'],
    cancelled: ['customer', 'admin'],
    in_progress: ['priest', 'admin'],
    no_show: ['priest', 'admin'],
    refund_pending: ['admin'],
  },
  in_progress: {
    completed: ['priest', 'admin'],
    no_show: ['priest', 'admin'],
    refund_pending: ['admin'],
  },
  cancelled: {
    refund_pending: ['admin', 'system', 'payment_webhook'],
  },
  no_show: {
    refund_pending: ['admin'],
  },
  refund_pending: {
    refunded: ['payment_webhook', 'admin'],
  },
  completed: {},
  refunded: {},
};

export function canTransition(from: BookingStatus, to: BookingStatus, actor: ActorKind): boolean {
  return TRANSITIONS[from][to]?.includes(actor) ?? false;
}

export function transitionBooking(
  from: BookingStatus,
  to: BookingStatus,
  actor: ActorKind,
): { ok: true; status: BookingStatus } | { ok: false; reason: 'invalid_transition' } {
  if (!canTransition(from, to, actor)) {
    return { ok: false, reason: 'invalid_transition' };
  }
  return { ok: true, status: to };
}
