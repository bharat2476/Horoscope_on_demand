import {
  BLOCKING_BOOKING_STATUSES,
  type BookingStatus,
  type OccupiedSlot,
  type PriestRecord,
} from '@/modules/puja/types';

export type AssignmentRequest = {
  bookingId: string;
  serviceId: string;
  language: string;
  startsAt: Date;
  endsAt: Date;
  preferredPriestId: string | null;
  status: BookingStatus;
};

export type AssignmentSuccess = {
  ok: true;
  priestId: string;
  usedPreference: boolean;
  preferredUnavailable: boolean;
};

export type AssignmentFailure = {
  ok: false;
  reason: 'invalid_booking' | 'no_priest';
};

function overlaps(left: OccupiedSlot, startsAt: Date, endsAt: Date): boolean {
  return left.startsAt.getTime() < endsAt.getTime() && startsAt.getTime() < left.endsAt.getTime();
}

export function priestCovers(
  priest: PriestRecord,
  request: AssignmentRequest,
  occupied: readonly OccupiedSlot[],
): boolean {
  if (priest.verificationStatus !== 'vetted' || priest.operationalStatus !== 'active') {
    return false;
  }
  if (
    !priest.serviceIds.includes(request.serviceId) ||
    !priest.languages.includes(request.language)
  ) {
    return false;
  }
  const covered = priest.windows.some(
    (window) =>
      window.startsAt.getTime() <= request.startsAt.getTime() &&
      window.endsAt.getTime() >= request.endsAt.getTime(),
  );
  if (!covered) {
    return false;
  }
  return !occupied.some(
    (slot) =>
      slot.priestId === priest.id &&
      slot.bookingId !== request.bookingId &&
      (BLOCKING_BOOKING_STATUSES as readonly string[]).includes(slot.status) &&
      overlaps(slot, request.startsAt, request.endsAt),
  );
}

export function assignPriest(
  priests: readonly PriestRecord[],
  occupied: readonly OccupiedSlot[],
  request: AssignmentRequest,
): AssignmentSuccess | AssignmentFailure {
  if (request.status !== 'pending_assignment' && request.status !== 'rescheduled') {
    return { ok: false, reason: 'invalid_booking' };
  }
  const eligible = priests
    .filter((priest) => priestCovers(priest, request, occupied))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (eligible.length === 0) {
    return { ok: false, reason: 'no_priest' };
  }
  const preferred = eligible.find((priest) => priest.id === request.preferredPriestId);
  const chosen = preferred ?? eligible[0];
  if (!chosen) {
    return { ok: false, reason: 'no_priest' };
  }
  const usedPreference = chosen.id === request.preferredPriestId;
  return {
    ok: true,
    priestId: chosen.id,
    usedPreference,
    preferredUnavailable: request.preferredPriestId !== null && !usedPreference,
  };
}
