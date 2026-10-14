export const BOOKING_STATUSES = [
  'pending_payment',
  'pending_assignment',
  'confirmed',
  'rescheduled',
  'cancelled',
  'in_progress',
  'completed',
  'no_show',
  'refund_pending',
  'refunded',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ACTOR_KINDS = ['customer', 'priest', 'admin', 'payment_webhook', 'system'] as const;

export type ActorKind = (typeof ACTOR_KINDS)[number];

export const FAMILY_FIELDS = ['householdName', 'gotra', 'sankalpName', 'nakshatra'] as const;

export type FamilyField = (typeof FAMILY_FIELDS)[number];

export const SESSION_KIND = 'private_family' as const;

export type SessionKind = typeof SESSION_KIND;

export const REVIEW_ISSUES = [
  'late_start',
  'audio',
  'video',
  'ritual_concern',
  'conduct',
  'other',
] as const;

export type ReviewIssue = (typeof REVIEW_ISSUES)[number];

export const BLOCKING_BOOKING_STATUSES = ['confirmed', 'rescheduled', 'in_progress'] as const;

export type BlockingBookingStatus = (typeof BLOCKING_BOOKING_STATUSES)[number];

export type ServiceCopy = {
  title: string;
  description: string;
  preparation: string;
};

export type LiveService = {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'retired';
  copy: ServiceCopy;
  pricePaise: number;
  currency: 'INR';
  durationMinutes: number;
  languages: readonly string[];
  minAdvanceHours: number;
  requiredFamilyFields: readonly FamilyField[];
};

export type FamilyDetails = {
  householdName?: string;
  gotra?: string;
  sankalpName?: string;
  nakshatra?: string;
};

export type BookingRequest = {
  customerId: string | null;
  service: LiveService;
  startsAt: Date;
  timeZone: string;
  language: string;
  family: FamilyDetails;
  sessionKind: string;
  groupPricing: boolean;
  now: Date;
};

export type CustomerBooking = {
  id: string;
  customerId: string | null;
  serviceId: string;
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  language: string;
  pricePaise: number;
  currency: 'INR';
  preferredPriestId: string | null;
  assignedPriestId: string | null;
  preferredUnavailable: boolean;
  sessionKind: SessionKind;
};

export type PriestRecord = {
  id: string;
  userId: string | null;
  displayName: string;
  verificationStatus: 'pending' | 'vetted' | 'suspended' | 'retired';
  operationalStatus: 'active' | 'inactive' | 'suspended';
  languages: readonly string[];
  serviceIds: readonly string[];
  windows: readonly { startsAt: Date; endsAt: Date }[];
};

export type OccupiedSlot = {
  bookingId: string;
  priestId: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
};

export type PaymentEvent = {
  provider: string;
  eventId: string;
  eventType: 'payment.captured' | 'payment.failed' | 'refund.processed';
  bookingId: string;
  amountPaise: number;
  currency: string;
};

export type StoredPaymentEvent = PaymentEvent & {
  result: 'applied' | 'rejected';
};

export type ReviewRecord = {
  bookingId: string;
  customerId: string | null;
  priestId: string;
  rating: number;
  feedback: string | null;
  issues: readonly ReviewIssue[];
  hidden: boolean;
  editCount: number;
};

export type NoticeKind =
  | 'booking_receipt'
  | 'payment_status'
  | 'booking_confirmed'
  | 'priest_assigned'
  | 'priest_fallback'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'rescheduled'
  | 'cancelled'
  | 'join_instructions'
  | 'completed_review_request';

export type PlannedNotice = {
  bookingId: string;
  kind: NoticeKind;
  dedupeKey: string;
  timeZone: string;
  scheduledFor: Date;
  localSummary: string;
};

export type SessionRole = 'customer' | 'priest' | 'family';

export type SessionAuthorization = {
  bookingId: string;
  room: string;
  identity: string;
  role: SessionRole;
  expiresAt: Date;
  recording: false;
  microphoneMuted: boolean;
};

export type AuditEntry = {
  action: string;
  actorId: string | null;
  actorKind: ActorKind;
  bookingId: string | null;
  priestId: string | null;
  detail: Record<string, string | boolean | null>;
};
