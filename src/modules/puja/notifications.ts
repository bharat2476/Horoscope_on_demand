import { addHours, formatInTimeZone } from '@/modules/puja/time';
import { type CustomerBooking, type NoticeKind, type PlannedNotice } from '@/modules/puja/types';

const REMINDERS: { kind: NoticeKind; hoursBefore: number }[] = [
  { kind: 'reminder_24h', hoursBefore: 24 },
  { kind: 'reminder_1h', hoursBefore: 1 },
];

export function noticeKey(bookingId: string, kind: NoticeKind, version: string): string {
  return `${bookingId}:${kind}:${version}`;
}

export function planNotices(
  booking: CustomerBooking,
  now: Date,
  kind: NoticeKind,
): PlannedNotice[] {
  const version = booking.startsAt.toISOString();
  const localSummary = formatInTimeZone(booking.startsAt, booking.timeZone);
  if (kind === 'reminder_24h' || kind === 'reminder_1h' || kind === 'join_instructions') {
    return scheduled(booking, now, version, localSummary).filter((notice) => notice.kind === kind);
  }
  return [
    {
      bookingId: booking.id,
      kind,
      dedupeKey: noticeKey(booking.id, kind, version),
      timeZone: booking.timeZone,
      scheduledFor: now,
      localSummary,
    },
  ];
}

export function planBookingNotices(booking: CustomerBooking, now: Date): PlannedNotice[] {
  const version = booking.startsAt.toISOString();
  const localSummary = formatInTimeZone(booking.startsAt, booking.timeZone);
  const immediate: NoticeKind[] = [];
  if (booking.status === 'pending_payment') {
    immediate.push('booking_receipt');
  }
  if (booking.status === 'pending_assignment') {
    immediate.push('payment_status');
  }
  if (booking.status === 'confirmed' || booking.status === 'rescheduled') {
    immediate.push('booking_confirmed', 'priest_assigned', 'join_instructions');
    if (booking.preferredUnavailable) {
      immediate.push('priest_fallback');
    }
  }
  if (
    booking.status === 'cancelled' ||
    booking.status === 'refund_pending' ||
    booking.status === 'refunded'
  ) {
    immediate.push('cancelled');
  }
  if (booking.status === 'completed') {
    immediate.push('completed_review_request');
  }
  const planned = immediate.map((kind) => ({
    bookingId: booking.id,
    kind,
    dedupeKey: noticeKey(booking.id, kind, version),
    timeZone: booking.timeZone,
    scheduledFor: kind === 'join_instructions' ? addHours(booking.startsAt, -0.25) : now,
    localSummary,
  }));
  if (booking.status === 'confirmed' || booking.status === 'rescheduled') {
    planned.push(...scheduled(booking, now, version, localSummary));
  }
  return planned.filter((notice) => notice.scheduledFor.getTime() >= now.getTime() - 1000);
}

function scheduled(
  booking: CustomerBooking,
  now: Date,
  version: string,
  localSummary: string,
): PlannedNotice[] {
  const notices: PlannedNotice[] = REMINDERS.map((reminder) => ({
    bookingId: booking.id,
    kind: reminder.kind,
    dedupeKey: noticeKey(booking.id, reminder.kind, version),
    timeZone: booking.timeZone,
    scheduledFor: addHours(booking.startsAt, -reminder.hoursBefore),
    localSummary,
  }));
  return notices.filter((notice) => notice.scheduledFor.getTime() > now.getTime());
}

export function deliverNotices(
  alreadySent: ReadonlySet<string>,
  planned: readonly PlannedNotice[],
): { send: PlannedNotice[]; duplicateKeys: string[] } {
  const send: PlannedNotice[] = [];
  const duplicateKeys: string[] = [];
  const seen = new Set(alreadySent);
  for (const notice of planned) {
    if (seen.has(notice.dedupeKey)) {
      duplicateKeys.push(notice.dedupeKey);
      continue;
    }
    seen.add(notice.dedupeKey);
    send.push(notice);
  }
  return { send, duplicateKeys };
}
