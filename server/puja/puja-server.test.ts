/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { credentialIsShortLived } from '../../src/modules/puja/sessions';
import { handlePaymentWebhook, handleSessionCredential, signWebhookBody } from './handlers';
import { verifyLiveKitToken } from './livekit';

const secret = 'video-secret-not-for-clients';
const nowSeconds = 1_760_000_000;

describe('puja server boundary', () => {
  it('rejects an unsigned payment webhook and treats a signed retry as a duplicate', async () => {
    const body = JSON.stringify({
      provider: 'razorpay',
      eventId: 'evt-1',
      eventType: 'payment.captured',
      bookingId: 'booking-1',
      amountPaise: 510000,
      currency: 'INR',
    });
    const seen = new Set<string>();
    const record = async (event: { eventId: string }) => {
      if (seen.has(event.eventId)) {
        return 'duplicate' as const;
      }
      seen.add(event.eventId);
      return 'applied' as const;
    };
    const unsigned = await handlePaymentWebhook({
      rawBody: body,
      signature: 'nope',
      secret: 'pay-secret',
      record,
    });
    expect(unsigned.status).toBe(401);
    expect(seen.size).toBe(0);

    const signature = signWebhookBody(body, 'pay-secret');
    const first = await handlePaymentWebhook({
      rawBody: body,
      signature,
      secret: 'pay-secret',
      record,
    });
    const second = await handlePaymentWebhook({
      rawBody: body,
      signature,
      secret: 'pay-secret',
      record,
    });
    expect(first).toEqual({ status: 200, result: 'applied' });
    expect(second).toEqual({ status: 200, result: 'duplicate' });
  });

  it('mints a short-lived LiveKit token and refuses recording or a stranger', () => {
    const granted = handleSessionCredential({
      grant: {
        bookingId: 'booking-1',
        room: 'puja_booking-1',
        identity: 'customer-1',
        role: 'customer',
        expiresAt: new Date((nowSeconds + 900) * 1000),
        microphoneMuted: true,
      },
      apiKey: 'api-key',
      apiSecret: secret,
      liveKitUrl: 'wss://example.livekit.cloud',
      nowSeconds,
      recordRequested: false,
      consentConfirmed: false,
    });
    expect(granted.status).toBe(200);
    const token = String(granted.body.token);
    expect(token).not.toContain(secret);
    expect(JSON.stringify(granted.body)).not.toContain(secret);
    expect(granted.body.recording).toBe(false);
    expect(verifyLiveKitToken(token, secret, nowSeconds)).toBe(true);
    expect(credentialIsShortLived(token, nowSeconds)).toBe(true);
    const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    expect(claims.video.roomRecord).toBe(false);

    expect(
      handleSessionCredential({
        grant: null,
        apiKey: 'api-key',
        apiSecret: secret,
        liveKitUrl: 'wss://example.livekit.cloud',
        nowSeconds,
        recordRequested: false,
        consentConfirmed: false,
      }).status,
    ).toBe(403);
    expect(
      handleSessionCredential({
        grant: {
          bookingId: 'booking-1',
          room: 'puja_booking-1',
          identity: 'customer-1',
          role: 'customer',
          expiresAt: new Date((nowSeconds + 900) * 1000),
          microphoneMuted: true,
        },
        apiKey: 'api-key',
        apiSecret: secret,
        liveKitUrl: 'wss://example.livekit.cloud',
        nowSeconds,
        recordRequested: true,
        consentConfirmed: false,
      }).body,
    ).toEqual({ error: 'recording_refused' });
  });

  it('keeps priest data and payment execution off the anonymous client', () => {
    const sql = readFileSync(
      path.join(__dirname, '../../supabase/migrations/20261014180000_live_puja.sql'),
      'utf8',
    );
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('constraint puja_priest_no_overlap');
    expect(sql).toContain("session_kind = 'private_family'");
    expect(sql).toContain('primary key (provider, event_id)');
    expect(sql).toContain('dedupe_key text not null unique');
    expect(sql).toContain("slug <> 'havan-homa' or min_advance_hours >= 48");
    expect(sql).toContain('recording_requested boolean not null default false');
    expect(sql).not.toMatch(/grant select on (table )?puja\.priests/i);
    expect(sql).toContain(
      'grant execute on function public.puja_apply_payment_event(text, text, text, text, uuid, integer, text) to service_role',
    );
    expect(sql).not.toContain(
      'grant execute on function public.puja_apply_payment_event(text, text, text, text, uuid, integer, text) to authenticated',
    );
    expect(sql).toContain('grant select on table public.live_puja_services to anon, authenticated');
  });
});
