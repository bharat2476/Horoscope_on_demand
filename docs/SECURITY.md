# Security

This milestone stores almost nothing and sends nothing. The rules below are here so the next milestone does not weaken that by accident.

## Secrets

- `.env` is gitignored. Only `.env.example` is committed, and its values are empty.
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are public client values. Expo inlines them into the Android binary. Treat them as visible to anyone who downloads the app.
- The Supabase service-role key, database password, and JWT secret must never be added to `.env`, `app.json`, source, or the client.
- `getSupabaseClient` keeps the session in process memory. It does not write the session to AsyncStorage. Encrypted on-device storage is not wired. A restarted app asks the person to sign in again.

## What the phone stores

AsyncStorage key `sg.preferences.v1` may contain a language code, a Rashi id, a city id, a tradition id, and notification intent. That store is not encrypted. It is acceptable for this version because it is not a credential and it stays on the device. Birth date, birth time, and birthplace are not fields in the preference type, and the parser drops unexpected keys. Notification delivery is stored as `off`.

If a later feature collects birth details, location history, email, or phone number, that feature needs its own review before code is written. Those values are personal data under India's Digital Personal Data Protection Act, 2023. The shell does not implement notice, consent, or a grievance contact because it does not collect that data.

## Accounts and the database

Public content must remain readable without a session. When tables exist:

- Enable Row Level Security on every table in the exposed schema.
- Let the anon role read only reviewed public content.
- Let a signed-in user read and write only their own preference row.
- Do not allow the anon or authenticated role to write horoscope, Panchang, ritual, or temple content. Editorial writes belong to a reviewed server path, not the mobile client.

Sign-in stays optional. Do not gate the general Rashi horoscope on an account.

## Location

This version does not request location permission. `expo-localization` is language detection only.

When Panchang needs a place, ask in context, offer a manually chosen city, and do not require GPS. Do not send precise location to an ad or analytics SDK unless a separate privacy decision allows it.

## Analytics and ads

`noopAnalytics` does not open a network request. Events may include a language code, a Rashi id, a content kind, and booleans. Birth details, coordinates, email, tradition, and city id are rejected. Do not add those fields without a new decision.

Ads and a public priest marketplace stay out of the client binary. Live family ceremonies, when configured, use the `puja` schema and a server-minted video credential. Do not put `LIVEKIT_API_SECRET`, `PUJA_PAYMENT_WEBHOOK_SECRET`, or the service-role key in the app. See [PUJA_BOOKING.md](PUJA_BOOKING.md). That feature is not production ready.

## Content integrity

Empty modules are a security control as well as a product control. A fabricated tithi or a fabricated temple can mislead someone about a fast, a festival, or a journey. Screens render a reading only when the module status is unavailable today, which means they render the placeholder. Tests lock the horoscope and Panchang results to `{ status: 'unavailable' }` and lock rituals and temples to empty arrays.

Do not cite scripture until the edition and the translation license are recorded. A short quote from memory is not a citation.

## Dependencies

`npm audit` reports vulnerabilities in the Expo and Jest dependency tree. They were not cleared with `npm audit fix --force`, because that upgrade path can break the SDK. Re-check the audit before a store build and patch within the versions Expo supports.

The stock Expo icon and splash image are still in `assets/`. Replace them before a public build so the app does not ship Expo's trademark as its own mark.

## Release hygiene

- Confirm `com.spiritualguidance.app` and the `spiritualguidance` URL scheme are owned by this project before they are used in the Play Console or in an OAuth redirect. Both are provisional.
- Generate the upload keystore outside the repo. `*.jks` and `*.keystore` patterns are gitignored; do not rename a keystore to slip past that.
- Do not commit a Google services file that contains production keys. None is part of this milestone.
