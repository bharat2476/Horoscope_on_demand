# Live family puja booking

This module adds private live ceremonies for one household. It does not add a public priest directory, group bookings, or shared sessions.

The feature is not production ready. `currentProductionEvidence()` in `src/modules/puja/production.ts` stays closed until a release review records payment verification, a published privacy notice, authorization checks, concurrency checks, and a live-video test on a device.

## Phases

1. **Rules.** Booking states, the 48-hour Havan floor, family-only requests, priest matching, payment idempotency, reviews, and reminder keys live in `src/modules/puja`. The phone cannot confirm a payment.
2. **Database.** `supabase/migrations/20261014180000_live_puja.sql` stores services, private priests, bookings, family details, reviews, payment events, notifications, and an audit log. Row Level Security is on. Anonymous clients can read `public.live_puja_services` only.
3. **Assignment and money.** After a verified payment webhook, the database assigns one vetted, active, qualified priest. A saved priest is preferred when free. Overlap is rejected by the `puja_priest_no_overlap` exclusion constraint inside the same transaction. Administrators reassign through `puja_admin_reassign`, which writes the audit log.
4. **Live video.** `server/puja` mints a short-lived LiveKit token. The token cannot record. The Android app calls `EXPO_PUBLIC_PUJA_SESSION_URL` and drops any credential that is missing an expiry or lasts longer than two hours. Permanent room secrets are not in the client.
5. **Screens.** Rituals links to the public catalog. Requesting a ceremony, paying, reviewing, and joining require a signed-in account. Household fields stay hidden until then. Gotra, sankalp, and nakshatra are optional unless an administrator marks them required for that service.

## Booking states

`pending_payment`, `pending_assignment`, `confirmed`, `rescheduled`, `cancelled`, `in_progress`, `completed`, `no_show`, `refund_pending`, `refunded`.

`puja.transition_allowed` is the server copy of `src/modules/puja/transitions.ts`. A client status value is ignored.

## Who can see what

| Person          | Can see                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Signed out      | Published service title, description, price, duration, languages, preparation, and advance hours |
| Customer        | Their bookings, their family details, the assigned priest's display name for that ceremony       |
| Assigned priest | That booking's family details while it is confirmed, rescheduled, or in progress                 |
| Administrator   | Priest records, complaints, rating averages, and the audit log, through admin functions          |

Customers cannot list priests. Priest phone, email, and verification documents are not returned by customer functions.

## Payment

`public.puja_apply_payment_event` is granted to `service_role` only. It still compares the webhook secret with `puja.runtime_config.key = 'payment_webhook_secret'`. Set that row in the database as the database owner. Do not commit the value.

The same provider event id is stored once. A retry returns `duplicate` and does not assign a second priest.

## Video

The credential host should:

1. Verify the caller's Supabase access token.
2. Call `puja_authorize_session` as that user.
3. Call `handleSessionCredential` in `server/puja/handlers.ts` with `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL`.
4. Return the short-lived token. Do not return the API secret.

Recording stays off. A request to record is refused until consent exists, and this build still does not enable recording after consent.

If the session drops, the screen reconnects up to three times and then tells the household to reschedule. It does not show a priest phone number.

## Notifications

Reminder rows use the booking's IANA time zone. The dedupe key is booking id, kind, and start time, so a retry does not send the same reminder twice. A reschedule changes the start time and can send a new reminder. No push provider is connected; rows wait in `puja.notifications`.

## Environment

See `.env.example`. Public values use the `EXPO_PUBLIC_` prefix. LiveKit secrets, the payment webhook secret, and the Supabase service-role key are server-only and must stay commented out of the client env file.

## Checks in this repository

`npm test` covers the state machine, the Havan rule, family-only rejection, preferred-priest fallback, serialized double-booking, payment retries, review limits, reminder idempotency, session authorization, credential lifetime, and the screen states above.

Those tests do not open a LiveKit room on a phone or settle a real payment. Do not treat a green unit run as a production sign-off.
