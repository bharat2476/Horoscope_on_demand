import {
  type CustomerBooking,
  type SessionAuthorization,
  type SessionRole,
} from '@/modules/puja/types';

export const SESSION_JOIN_EARLY_MS = 15 * 60 * 1000;
export const SESSION_GRACE_MS = 30 * 60 * 1000;
export const MAX_CREDENTIAL_TTL_MS = 2 * 60 * 60 * 1000;

const JOINABLE = new Set(['confirmed', 'rescheduled', 'in_progress']);

export type SessionAccessInput = {
  booking: CustomerBooking;
  userId: string;
  priestUserId: string | null;
  now: Date;
  familyUserIds: readonly string[];
};

export function authorizeSession(
  input: SessionAccessInput,
):
  | { ok: true; authorization: SessionAuthorization }
  | { ok: false; reason: 'unauthorized' | 'not_open' | 'ended' } {
  const role: SessionRole | null =
    input.booking.customerId === input.userId
      ? 'customer'
      : input.priestUserId !== null && input.priestUserId === input.userId
        ? 'priest'
        : input.familyUserIds.includes(input.userId)
          ? 'family'
          : null;
  if (!role) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!JOINABLE.has(input.booking.status)) {
    return { ok: false, reason: 'not_open' };
  }
  const opens = input.booking.startsAt.getTime() - SESSION_JOIN_EARLY_MS;
  const closes = input.booking.endsAt.getTime() + SESSION_GRACE_MS;
  if (input.now.getTime() < opens) {
    return { ok: false, reason: 'not_open' };
  }
  if (input.now.getTime() > closes) {
    return { ok: false, reason: 'ended' };
  }
  const expiresAt = new Date(Math.min(input.now.getTime() + MAX_CREDENTIAL_TTL_MS, closes));
  return {
    ok: true,
    authorization: {
      bookingId: input.booking.id,
      room: `puja_${input.booking.id}`,
      identity: input.userId,
      role,
      expiresAt,
      recording: false,
      microphoneMuted: role !== 'priest',
    },
  };
}

export type CredentialClaims = {
  exp: number;
  iat?: number;
  video?: { room?: string; roomRecord?: boolean; roomJoin?: boolean };
};

export function decodeCredentialPayload(token: string): CredentialClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  try {
    const json = decodeBase64Url(parts[1]);
    const parsed = JSON.parse(json) as CredentialClaims;
    if (typeof parsed.exp !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function credentialIsShortLived(
  token: string,
  nowSeconds: number,
  maxTtlSeconds = MAX_CREDENTIAL_TTL_MS / 1000,
): boolean {
  const claims = decodeCredentialPayload(token);
  if (!claims) {
    return false;
  }
  if (claims.video?.roomRecord === true) {
    return false;
  }
  const ttl = claims.exp - nowSeconds;
  return ttl > 0 && ttl <= maxTtlSeconds;
}

export function recordingAllowed(consents: {
  requested: boolean;
  requiredUserIds: readonly string[];
  consentedUserIds: readonly string[];
}): boolean {
  if (!consents.requested || consents.requiredUserIds.length === 0) {
    return false;
  }
  return consents.requiredUserIds.every((userId) => consents.consentedUserIds.includes(userId));
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return globalThis.atob(padded);
}
