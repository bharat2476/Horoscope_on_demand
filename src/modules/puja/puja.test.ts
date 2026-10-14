import { assignPriest } from '@/modules/puja/assignment';
import { createSessionController } from '@/modules/puja/controller';
import { createAssignmentLedger } from '@/modules/puja/ledger';
import { deliverNotices, planBookingNotices } from '@/modules/puja/notifications';
import { applyPaymentEvent } from '@/modules/puja/payments';
import { applySavedPreference, savePreferredPriest } from '@/modules/puja/preferences';
import { currentProductionEvidence, productionGates } from '@/modules/puja/production';
import { aggregateRatings, flagReview, submitReview } from '@/modules/puja/reviews';
import {
  acceptClientPaymentConfirmation,
  configureService,
  validateBookingRequest,
} from '@/modules/puja/rules';
import { SAMPLE_SERVICES } from '@/modules/puja/sample-catalog';
import { authorizeSession, recordingAllowed } from '@/modules/puja/sessions';
import { meetsAdvanceRule, zonedWallTimeToUtc } from '@/modules/puja/time';
import { canTransition } from '@/modules/puja/transitions';
import {
  canBrowsePriestDirectory,
  canReadFamilyDetails,
  exposePriest,
} from '@/modules/puja/access';
import { BOOKING_STATUSES, type CustomerBooking, type PriestRecord } from '@/modules/puja/types';

const havan = SAMPLE_SERVICES[0];
const katha = SAMPLE_SERVICES[1];
if (!havan || !katha) {
  throw new Error('sample catalog missing');
}

const now = new Date('2026-10-14T08:00:00.000Z');

function booking(overrides: Partial<CustomerBooking> = {}): CustomerBooking {
  return {
    id: 'booking-1',
    customerId: 'customer-1',
    serviceId: havan.id,
    status: 'pending_payment',
    startsAt: new Date('2026-10-17T01:30:00.000Z'),
    endsAt: new Date('2026-10-17T03:00:00.000Z'),
    timeZone: 'Asia/Kolkata',
    language: 'hi',
    pricePaise: havan.pricePaise,
    currency: 'INR',
    preferredPriestId: null,
    assignedPriestId: null,
    preferredUnavailable: false,
    sessionKind: 'private_family',
    ...overrides,
  };
}

function priest(overrides: Partial<PriestRecord> = {}): PriestRecord {
  return {
    id: 'priest-a',
    userId: 'priest-user-a',
    displayName: 'Priest A',
    verificationStatus: 'vetted',
    operationalStatus: 'active',
    languages: ['hi', 'en'],
    serviceIds: [havan.id],
    windows: [
      {
        startsAt: new Date('2026-10-16T00:00:00.000Z'),
        endsAt: new Date('2026-10-18T00:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

function token(exp: number, roomRecord = false): string {
  const payload = btoa(JSON.stringify({ exp, video: { room: 'puja_booking-1', roomRecord } }));
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
}

describe('live puja booking', () => {
  it('keeps the public catalog free of priest identity and prices each private ceremony once', () => {
    expect(canBrowsePriestDirectory()).toBe(false);
    expect(SAMPLE_SERVICES.map((service) => service.slug)).toEqual([
      'havan-homa',
      'satyanarayan-katha',
      'ganesh-puja',
    ]);
    expect(havan.minAdvanceHours).toBeGreaterThanOrEqual(48);
    expect(havan.copy.description.toLowerCase()).not.toContain('will cure');
  });

  it('requires 48 hours for Havan and rejects group or public sessions', () => {
    const startsAt = zonedWallTimeToUtc('2026-10-16', '07:00', 'Asia/Kolkata');
    expect(startsAt?.toISOString()).toBe('2026-10-16T01:30:00.000Z');
    const tooSoon = validateBookingRequest({
      customerId: 'customer-1',
      service: havan,
      startsAt: new Date('2026-10-15T08:00:00.000Z'),
      timeZone: 'Asia/Kolkata',
      language: 'hi',
      family: { householdName: 'Sharma' },
      sessionKind: 'private_family',
      groupPricing: false,
      now,
    });
    expect(tooSoon).toEqual({ ok: false, reason: 'advance_required' });
    expect(meetsAdvanceRule(new Date('2026-10-16T08:00:00.000Z'), now, 48)).toBe(true);

    const group = validateBookingRequest({
      customerId: 'customer-1',
      service: katha,
      startsAt: new Date('2026-10-16T08:00:00.000Z'),
      timeZone: 'Asia/Kolkata',
      language: 'hi',
      family: { householdName: 'Sharma', gotra: '' },
      sessionKind: 'public',
      groupPricing: true,
      now,
    });
    expect(group).toEqual({ ok: false, reason: 'family_only' });

    const accepted = validateBookingRequest({
      customerId: 'customer-1',
      service: havan,
      startsAt: new Date('2026-10-17T01:30:00.000Z'),
      timeZone: 'Asia/Kolkata',
      language: 'hi',
      family: { householdName: 'Sharma' },
      sessionKind: 'private_family',
      groupPricing: false,
      now,
    });
    expect(accepted).toMatchObject({ ok: true, pricePaise: 510000 });
    expect(acceptClientPaymentConfirmation()).toEqual({ ok: false, reason: 'untrusted_client' });
  });

  it('lets an administrator change a service and keeps the Havan floor', () => {
    expect(configureService('customer', havan)).toEqual({ ok: false, reason: 'forbidden' });
    expect(configureService('admin', { ...havan, minAdvanceHours: 24 })).toEqual({
      ok: false,
      reason: 'havan_advance',
    });
    expect(configureService('admin', { ...katha, minAdvanceHours: 6, pricePaise: 100 }).ok).toBe(
      true,
    );
  });

  it('enforces the booking lifecycle and ignores a repeated payment event', () => {
    for (const status of BOOKING_STATUSES) {
      expect(canTransition(status, status, 'admin')).toBe(false);
    }
    expect(canTransition('pending_payment', 'confirmed', 'payment_webhook')).toBe(false);
    expect(canTransition('completed', 'refunded', 'admin')).toBe(false);

    const captured = {
      provider: 'razorpay',
      eventId: 'evt-1',
      eventType: 'payment.captured' as const,
      bookingId: 'booking-1',
      amountPaise: havan.pricePaise,
      currency: 'INR',
    };
    const first = applyPaymentEvent(booking(), [], captured);
    expect(first.result).toBe('applied');
    expect(first.booking.status).toBe('pending_assignment');
    const stored = first.stored ? [first.stored] : [];
    const repeat = applyPaymentEvent(first.booking, stored, captured);
    expect(repeat.result).toBe('duplicate');
    expect(repeat.booking.status).toBe('pending_assignment');

    const wrongAmount = applyPaymentEvent(booking(), [], {
      ...captured,
      eventId: 'evt-2',
      amountPaise: 1,
    });
    expect(wrongAmount.result).toBe('rejected');
    expect(wrongAmount.booking.status).toBe('pending_payment');
    const wrongRetry = applyPaymentEvent(
      booking(),
      wrongAmount.stored ? [wrongAmount.stored] : [],
      { ...captured, eventId: 'evt-2', amountPaise: havan.pricePaise },
    );
    expect(wrongRetry.result).toBe('duplicate');
    expect(wrongRetry.booking.status).toBe('pending_payment');
  });

  it('assigns the preferred priest or another qualified priest without a double booking', async () => {
    const preferred = priest();
    const other = priest({ id: 'priest-b', userId: 'priest-user-b', displayName: 'Priest B' });
    const startsAt = new Date('2026-10-17T01:30:00.000Z');
    const endsAt = new Date('2026-10-17T03:00:00.000Z');
    const choice = assignPriest([other, preferred], [], {
      bookingId: 'booking-1',
      serviceId: havan.id,
      language: 'hi',
      startsAt,
      endsAt,
      preferredPriestId: 'priest-a',
      status: 'pending_assignment',
    });
    expect(choice).toMatchObject({ ok: true, priestId: 'priest-a', usedPreference: true });

    const ledger = createAssignmentLedger();
    ledger.addPriest(preferred);
    ledger.addPriest(other);
    ledger.addBooking(
      booking({
        id: 'booking-1',
        status: 'pending_assignment',
        preferredPriestId: 'priest-a',
        startsAt,
        endsAt,
      }),
    );
    ledger.addBooking(
      booking({
        id: 'booking-2',
        status: 'pending_assignment',
        preferredPriestId: 'priest-a',
        startsAt,
        endsAt,
      }),
    );
    const [firstAssign, secondAssign] = await Promise.all([
      ledger.assign('booking-1'),
      ledger.assign('booking-2'),
    ]);
    const assigned = [firstAssign, secondAssign].flatMap((result) =>
      result.ok ? [result.priestId] : [],
    );
    expect(assigned).toHaveLength(2);
    expect(new Set(assigned).size).toBe(2);
    expect(
      [firstAssign, secondAssign].some((result) => result.ok && result.preferredUnavailable),
    ).toBe(true);

    const solo = createAssignmentLedger();
    solo.addPriest(preferred);
    solo.addBooking(booking({ id: 'booking-1', status: 'pending_assignment', startsAt, endsAt }));
    solo.addBooking(booking({ id: 'booking-2', status: 'pending_assignment', startsAt, endsAt }));
    expect((await solo.assign('booking-1')).ok).toBe(true);
    expect(await solo.assign('booking-2')).toEqual({ ok: false, reason: 'no_priest' });
    expect(solo.read('booking-2')?.status).toBe('pending_assignment');

    const suspended = assignPriest([priest({ operationalStatus: 'suspended' })], [], {
      bookingId: 'booking-3',
      serviceId: havan.id,
      language: 'hi',
      startsAt,
      endsAt,
      preferredPriestId: null,
      status: 'pending_assignment',
    });
    expect(suspended).toEqual({ ok: false, reason: 'no_priest' });
  });

  it('keeps a saved priest as a preference and still allows a different assignment', () => {
    const completed = booking({
      status: 'completed',
      assignedPriestId: 'priest-a',
    });
    const saved = savePreferredPriest({
      customerId: 'customer-1',
      booking: completed,
      priest: priest(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) {
      return;
    }
    const next = applySavedPreference(
      booking({ id: 'booking-9', status: 'pending_payment', assignedPriestId: null }),
      saved.preference,
    );
    expect(next.preferredPriestId).toBe('priest-a');
    expect(next.assignedPriestId).toBeNull();
    expect(
      savePreferredPriest({ customerId: 'customer-2', booking: completed, priest: priest() }),
    ).toEqual({
      ok: false,
      reason: 'forbidden',
    });
  });

  it('accepts one review for a completed booking and hides flagged feedback from the average', () => {
    const completed = booking({ status: 'completed', assignedPriestId: 'priest-a' });
    const created = submitReview({
      booking: completed,
      customerId: 'customer-1',
      priestId: 'priest-a',
      rating: 5,
      feedback: 'Clear audio',
      issues: [],
      existing: null,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const edited = submitReview({
      booking: completed,
      customerId: 'customer-1',
      priestId: 'priest-a',
      rating: 4,
      feedback: 'Started late',
      issues: ['late_start'],
      existing: created.review,
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) {
      return;
    }
    expect(
      submitReview({
        booking: completed,
        customerId: 'customer-1',
        priestId: 'priest-a',
        rating: 1,
        feedback: null,
        issues: [],
        existing: edited.review,
      }),
    ).toEqual({ ok: false, reason: 'edit_closed' });
    expect(
      submitReview({
        booking: booking(),
        customerId: 'customer-1',
        priestId: null,
        rating: 5,
        feedback: null,
        issues: [],
        existing: null,
      }),
    ).toEqual({ ok: false, reason: 'not_completed' });

    const flagged = flagReview('admin', edited.review, 'abusive');
    expect(flagged.ok).toBe(true);
    if (!flagged.ok) {
      return;
    }
    expect(aggregateRatings([created.review, flagged.review])).toEqual({ count: 1, average: 5 });
    expect(flagReview('customer', edited.review, 'no')).toEqual({ ok: false, reason: 'forbidden' });
  });

  it('plans timezone reminders once and does not expose priest contact details', () => {
    const confirmed = booking({
      status: 'confirmed',
      assignedPriestId: 'priest-a',
      preferredPriestId: 'priest-b',
      preferredUnavailable: true,
      startsAt: new Date('2026-10-17T01:30:00.000Z'),
    });
    const planned = planBookingNotices(confirmed, now);
    expect(planned.some((notice) => notice.kind === 'priest_fallback')).toBe(true);
    expect(
      planned.some(
        (notice) => notice.kind === 'reminder_24h' && notice.timeZone === 'Asia/Kolkata',
      ),
    ).toBe(true);
    expect(planned.every((notice) => notice.localSummary === '2026-10-17 07:00')).toBe(true);
    const first = deliverNotices(new Set(), planned);
    const second = deliverNotices(new Set(first.send.map((notice) => notice.dedupeKey)), planned);
    expect(second.send).toEqual([]);
    expect(second.duplicateKeys.length).toBe(planned.length);

    expect(exposePriest('anonymous', priest(), false)).toEqual({
      displayName: null,
      contactEmail: null,
      contactPhone: null,
      documents: null,
    });
    expect(exposePriest('customer', priest(), true).displayName).toBe('Priest A');
    expect(exposePriest('customer', priest(), true).contactPhone).toBeNull();
    expect(canReadFamilyDetails('assigned_priest', false, true)).toBe(true);
    expect(canReadFamilyDetails('customer', false, true)).toBe(false);
    expect(canReadFamilyDetails('anonymous', true, true)).toBe(false);
  });

  it('authorizes only the household and the assigned priest, with recording off', () => {
    const live = booking({
      status: 'confirmed',
      assignedPriestId: 'priest-a',
      startsAt: new Date('2026-10-14T08:10:00.000Z'),
      endsAt: new Date('2026-10-14T09:10:00.000Z'),
    });
    const customer = authorizeSession({
      booking: live,
      userId: 'customer-1',
      priestUserId: 'priest-user-a',
      now,
      familyUserIds: ['family-1'],
    });
    expect(customer.ok).toBe(true);
    if (customer.ok) {
      expect(customer.authorization.recording).toBe(false);
      expect(customer.authorization.microphoneMuted).toBe(true);
      expect(customer.authorization.room).toBe('puja_booking-1');
    }
    expect(
      authorizeSession({
        booking: live,
        userId: 'stranger',
        priestUserId: 'priest-user-a',
        now,
        familyUserIds: ['family-1'],
      }),
    ).toEqual({ ok: false, reason: 'unauthorized' });
    const priestJoin = authorizeSession({
      booking: live,
      userId: 'priest-user-a',
      priestUserId: 'priest-user-a',
      now,
      familyUserIds: [],
    });
    expect(priestJoin.ok && priestJoin.authorization.microphoneMuted).toBe(false);
    expect(
      recordingAllowed({
        requested: false,
        requiredUserIds: ['customer-1'],
        consentedUserIds: ['customer-1'],
      }),
    ).toBe(false);
    expect(
      recordingAllowed({
        requested: true,
        requiredUserIds: ['customer-1', 'priest-user-a'],
        consentedUserIds: ['customer-1'],
      }),
    ).toBe(false);

    const controller = createSessionController({
      role: 'customer',
      token: token(Math.floor(now.getTime() / 1000) + 600),
      nowSeconds: Math.floor(now.getTime() / 1000),
    });
    expect(controller.getState().microphone).toBe('muted');
    expect(controller.connect().phase).toBe('connected');
    expect(controller.onLinkLost().phase).toBe('reconnecting');
    expect(controller.reconnectSucceeded().phase).toBe('connected');
    controller.onLinkLost();
    controller.onLinkLost();
    controller.onLinkLost();
    expect(controller.onLinkLost().failure).toBe('interrupted');
    expect(controller.end().phase).toBe('ended');

    const expired = createSessionController({
      role: 'customer',
      token: token(Math.floor(now.getTime() / 1000) - 10),
      nowSeconds: Math.floor(now.getTime() / 1000),
    });
    expect(expired.connect().failure).toBe('expired');
  });

  it('stays closed for production until every release gate is recorded', () => {
    expect(productionGates(currentProductionEvidence()).ready).toBe(false);
    expect(
      productionGates({
        paymentWebhookVerified: true,
        privacyNoticePublished: true,
        authorizationTestsPassed: true,
        concurrencyTestsPassed: true,
        liveVideoDeviceTestPassed: true,
      }).ready,
    ).toBe(true);
  });
});
