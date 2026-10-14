import { type CustomerBooking, type PriestRecord } from '@/modules/puja/types';

export type PreferredPriest = {
  customerId: string;
  priestId: string;
  sourceBookingId: string;
};

export function savePreferredPriest(input: {
  customerId: string | null;
  booking: CustomerBooking;
  priest: PriestRecord | null;
}):
  | { ok: true; preference: PreferredPriest }
  | { ok: false; reason: 'forbidden' | 'not_completed' | 'priest_unavailable' } {
  if (!input.customerId || input.booking.customerId !== input.customerId) {
    return { ok: false, reason: 'forbidden' };
  }
  if (input.booking.status !== 'completed' || !input.booking.assignedPriestId) {
    return { ok: false, reason: 'not_completed' };
  }
  if (!input.priest || input.priest.id !== input.booking.assignedPriestId) {
    return { ok: false, reason: 'priest_unavailable' };
  }
  if (
    input.priest.verificationStatus !== 'vetted' ||
    input.priest.operationalStatus === 'suspended'
  ) {
    return { ok: false, reason: 'priest_unavailable' };
  }
  return {
    ok: true,
    preference: {
      customerId: input.customerId,
      priestId: input.priest.id,
      sourceBookingId: input.booking.id,
    },
  };
}

/** Copies a saved priest onto the next request without assigning that priest. */
export function applySavedPreference(
  booking: CustomerBooking,
  preference: PreferredPriest | null,
): CustomerBooking {
  if (!preference || preference.customerId !== booking.customerId) {
    return booking;
  }
  return {
    ...booking,
    preferredPriestId: preference.priestId,
    assignedPriestId: booking.assignedPriestId,
  };
}
