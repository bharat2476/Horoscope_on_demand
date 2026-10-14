import { createHmac, timingSafeEqual } from 'node:crypto';

import { mintLiveKitToken, verifyLiveKitToken } from './livekit';

export type PaymentWebhookBody = {
  provider: string;
  eventId: string;
  eventType: 'payment.captured' | 'payment.failed' | 'refund.processed';
  bookingId: string;
  amountPaise: number;
  currency: string;
};

export function signWebhookBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = signWebhookBody(body, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export type PaymentRecord = (
  event: PaymentWebhookBody,
  secret: string,
) => Promise<'applied' | 'duplicate' | 'rejected' | 'unassigned'>;

export async function handlePaymentWebhook(input: {
  rawBody: string;
  signature: string | null;
  secret: string;
  record: PaymentRecord;
}): Promise<{ status: number; result: string }> {
  if (!input.signature || !verifyWebhookSignature(input.rawBody, input.signature, input.secret)) {
    return { status: 401, result: 'rejected' };
  }
  let parsed: PaymentWebhookBody;
  try {
    parsed = JSON.parse(input.rawBody) as PaymentWebhookBody;
  } catch {
    return { status: 400, result: 'rejected' };
  }
  if (!parsed.provider || !parsed.eventId || !parsed.bookingId) {
    return { status: 400, result: 'rejected' };
  }
  const result = await input.record(parsed, input.secret);
  return { status: 200, result };
}

export type SessionGrant = {
  bookingId: string;
  room: string;
  identity: string;
  role: 'customer' | 'priest' | 'family';
  expiresAt: Date;
  microphoneMuted: boolean;
};

export function handleSessionCredential(input: {
  grant: SessionGrant | null;
  apiKey: string;
  apiSecret: string;
  liveKitUrl: string;
  nowSeconds: number;
  recordRequested: boolean;
  consentConfirmed: boolean;
}): { status: number; body: Record<string, unknown> } {
  if (input.recordRequested) {
    return {
      status: input.consentConfirmed ? 409 : 403,
      body: { error: input.consentConfirmed ? 'recording_not_enabled' : 'recording_refused' },
    };
  }
  if (!input.grant) {
    return { status: 403, body: { error: 'unauthorized' } };
  }
  const ttlSeconds = Math.floor(input.grant.expiresAt.getTime() / 1000) - input.nowSeconds;
  if (ttlSeconds <= 0) {
    return { status: 403, body: { error: 'expired' } };
  }
  const minted = mintLiveKitToken({
    apiKey: input.apiKey,
    apiSecret: input.apiSecret,
    identity: input.grant.identity,
    name: input.grant.role,
    room: input.grant.room,
    ttlSeconds,
    nowSeconds: input.nowSeconds,
    canPublish: true,
  });
  if (!verifyLiveKitToken(minted.token, input.apiSecret, input.nowSeconds)) {
    return { status: 500, body: { error: 'unavailable' } };
  }
  return {
    status: 200,
    body: {
      provider: 'livekit',
      url: input.liveKitUrl,
      token: minted.token,
      expiresAt: minted.expiresAt,
      room: input.grant.room,
      microphoneMuted: input.grant.microphoneMuted,
      recording: false,
    },
  };
}
