import { meetsAdvanceRule, isValidTimeZone } from '@/modules/puja/time';
import {
  FAMILY_FIELDS,
  SESSION_KIND,
  type BookingRequest,
  type FamilyDetails,
  type FamilyField,
  type LiveService,
} from '@/modules/puja/types';

export type BookingRuleFailure =
  | 'authentication_required'
  | 'service_unavailable'
  | 'invalid_timezone'
  | 'advance_required'
  | 'language_unsupported'
  | 'family_only'
  | 'missing_family_field'
  | 'invalid_price';

export function havanAdvanceFloor(slug: string, minAdvanceHours: number): number {
  if (slug === 'havan-homa') {
    return Math.max(minAdvanceHours, 48);
  }
  return minAdvanceHours;
}

export function missingFamilyFields(
  required: readonly FamilyField[],
  family: FamilyDetails,
): FamilyField[] {
  return required.filter((field) => {
    const value = family[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

export function validateBookingRequest(
  request: BookingRequest,
):
  | { ok: true; pricePaise: number; currency: 'INR'; minAdvanceHours: number }
  | { ok: false; reason: BookingRuleFailure } {
  if (!request.customerId) {
    return { ok: false, reason: 'authentication_required' };
  }
  if (request.service.status !== 'published') {
    return { ok: false, reason: 'service_unavailable' };
  }
  if (request.sessionKind !== SESSION_KIND || request.groupPricing) {
    return { ok: false, reason: 'family_only' };
  }
  if (!isValidTimeZone(request.timeZone)) {
    return { ok: false, reason: 'invalid_timezone' };
  }
  const minAdvanceHours = havanAdvanceFloor(request.service.slug, request.service.minAdvanceHours);
  if (!meetsAdvanceRule(request.startsAt, request.now, minAdvanceHours)) {
    return { ok: false, reason: 'advance_required' };
  }
  if (!request.service.languages.includes(request.language)) {
    return { ok: false, reason: 'language_unsupported' };
  }
  if (missingFamilyFields(request.service.requiredFamilyFields, request.family).length > 0) {
    return { ok: false, reason: 'missing_family_field' };
  }
  if (!Number.isInteger(request.service.pricePaise) || request.service.pricePaise < 0) {
    return { ok: false, reason: 'invalid_price' };
  }
  return {
    ok: true,
    pricePaise: request.service.pricePaise,
    currency: request.service.currency,
    minAdvanceHours,
  };
}

export function configureService(
  actorKind: 'admin' | 'customer' | 'priest',
  service: LiveService,
):
  | { ok: true; service: LiveService }
  | { ok: false; reason: 'forbidden' | 'havan_advance' | 'invalid_price' } {
  if (actorKind !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  if (service.slug === 'havan-homa' && service.minAdvanceHours < 48) {
    return { ok: false, reason: 'havan_advance' };
  }
  if (
    !Number.isInteger(service.pricePaise) ||
    service.pricePaise < 0 ||
    service.durationMinutes <= 0
  ) {
    return { ok: false, reason: 'invalid_price' };
  }
  const required = service.requiredFamilyFields.filter((field) => FAMILY_FIELDS.includes(field));
  return { ok: true, service: { ...service, requiredFamilyFields: required } };
}

/** The phone cannot confirm a payment. Only a verified webhook may do that. */
export function acceptClientPaymentConfirmation(): { ok: false; reason: 'untrusted_client' } {
  return { ok: false, reason: 'untrusted_client' };
}
