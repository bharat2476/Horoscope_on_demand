import { assignPriest } from '@/modules/puja/assignment';
import { transitionBooking } from '@/modules/puja/transitions';
import { type AssignmentFailure, type AssignmentSuccess } from '@/modules/puja/assignment';
import {
  type BookingStatus,
  type CustomerBooking,
  type OccupiedSlot,
  type PriestRecord,
} from '@/modules/puja/types';

export type LedgerBooking = CustomerBooking;

/**
 * Serializes assignment the way a database transaction with row locks does.
 * Overlapping confirmed bookings for one priest cannot both commit.
 */
export function createAssignmentLedger() {
  const priests = new Map<string, PriestRecord>();
  const bookings = new Map<string, LedgerBooking>();
  let chain: Promise<unknown> = Promise.resolve();

  function exclusive<T>(task: () => T): Promise<T> {
    const run = chain.then(task, task);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function occupied(): OccupiedSlot[] {
    return [...bookings.values()]
      .filter((booking) => booking.assignedPriestId)
      .map((booking) => ({
        bookingId: booking.id,
        priestId: booking.assignedPriestId as string,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      }));
  }

  return {
    addPriest(priest: PriestRecord) {
      priests.set(priest.id, priest);
    },
    addBooking(booking: LedgerBooking) {
      bookings.set(booking.id, booking);
    },
    read(bookingId: string) {
      return bookings.get(bookingId) ?? null;
    },
    assign(bookingId: string): Promise<AssignmentSuccess | AssignmentFailure> {
      return exclusive(() => {
        const booking = bookings.get(bookingId);
        if (!booking) {
          return { ok: false, reason: 'invalid_booking' };
        }
        const decision = assignPriest([...priests.values()], occupied(), {
          bookingId: booking.id,
          serviceId: booking.serviceId,
          language: booking.language,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          preferredPriestId: booking.preferredPriestId,
          status: booking.status,
        });
        if (!decision.ok) {
          return decision;
        }
        const moved = transitionBooking(booking.status, 'confirmed', 'system');
        if (!moved.ok) {
          return { ok: false, reason: 'invalid_booking' };
        }
        const next = {
          ...booking,
          status: 'confirmed' as BookingStatus,
          assignedPriestId: decision.priestId,
          preferredUnavailable: decision.preferredUnavailable,
        };
        const clash = occupied().some(
          (slot) =>
            slot.priestId === decision.priestId &&
            slot.bookingId !== booking.id &&
            (slot.status === 'confirmed' ||
              slot.status === 'rescheduled' ||
              slot.status === 'in_progress') &&
            slot.startsAt.getTime() < next.endsAt.getTime() &&
            next.startsAt.getTime() < slot.endsAt.getTime(),
        );
        if (clash) {
          return { ok: false, reason: 'no_priest' };
        }
        bookings.set(booking.id, next);
        return decision;
      });
    },
  };
}
