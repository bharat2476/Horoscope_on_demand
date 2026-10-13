# Privacy and account data

Public screens stay readable without an account. Language, Rashi, city, and tradition are separate choices. The app does not infer a language from a city, a name, or coordinates, and it does not collect birth date, birth time, or birthplace for a general Rashi horoscope.

## What is stored

On the device, key `sg.preferences.v1` may contain:

- language preference (`system` or one of the ten supported languages)
- optional Rashi id
- optional city id chosen from the list
- optional tradition id (`smarta`, `vaishnava`, `shaiva`, or `shakta`)
- notification intent for festivals and rituals

Notification delivery is `off`. The app does not request notification permission and does not register for push.

The parser drops unknown keys. Birth fields and coordinates are not part of the saved object.

## Account data

Sign-in is optional email and password through Supabase Auth, using the public anon key only. Password recovery sends Supabase's reset email. Sign-out clears the in-memory session.

A signed-in user may confirm one of three choices: keep this device, use the account copy, or copy this device to the account. Nothing is uploaded before that confirmation. The uploaded row is `public.private_preferences` and contains only the fields listed above.

`public.delete_own_account()` deletes that row and the `auth.users` row for `auth.uid()`. The mobile app calls it through the anon key as the signed-in user. It does not contain the service-role key.

## Row Level Security

`public.private_preferences` has RLS enabled. `authenticated` may select, insert, update, and delete only where `user_id = auth.uid()`. `anon` has no privileges on that table. Published ritual, festival, and temple views from the content migration remain readable without a session. Anonymous clients cannot write them.

## Retention and sharing

Device settings remain until the person clears app data, uninstalls the app, or clears them in the app. Account settings remain until account deletion. There is no analytics vendor. Events that exist in code carry a language code or a boolean meaning "a value is selected". They do not carry birth details, coordinates, the Rashi id, or the city id.

The only third party is Supabase, and only after a project is configured. It would process the email address, the session, and the confirmed preference row. No push provider is connected.

## Translation workflow

English is the source catalog. Every other catalog must contain the same keys; the test fails when one is missing. Indic catalogs are `draft` until a native speaker is recorded in `REVIEWED_LOCALES`. Sanskrit Rashi names are stored in Devanagari and rendered without Latin text transformation.

## Data-safety draft

This section is a draft for a later Play Console form. It has not been submitted, and it is not a Play approval.

If sign-in stays off, the app collects no account data. Device settings stay on the phone. Analytics does not leave the device. No advertising identifier is used. Location, photos, contacts, microphone, and notifications are not requested.

If sign-in is turned on, the draft declaration is:

- Email address, collected for account management, optional, encrypted in transit by Supabase. Shared with Supabase as the processor. The app does not sell it.
- App preferences copied after confirmation: language, Rashi id, city id, tradition id, and notification intent. Tradition is an optional religious label. Declare it if the account copy is enabled.
- Account deletion is initiated in Settings. The database function deletes the preference row and the auth user. A public web page for deletion requests does not exist yet.
- Device settings remain on the phone after account deletion until the person clears app data.

## Support contact

No support email, phone number, or website is assigned in this repository. Do not publish the privacy policy or the store listing until a real contact is chosen.

## Unresolved decisions

- Indic translations still need native-speaker review before they are marked reviewed.
- Session tokens stay in process memory. Encrypted on-device storage is not wired, so a restarted app asks the person to sign in again.
- `delete_own_account` deletes `auth.users` as the function owner. A hosted Supabase project must confirm that this role is allowed to delete auth rows. If it is not, deletion of the auth user has to move to a server function. The service-role key still must not enter the app.
- Supabase's own auth logs, email delivery, and backup retention are outside this repository and are not yet limited by a project setting.
- A grievance contact and a DPDP notice are not published. They are needed before sign-in is turned on for people in India, because the email address is personal data.
- The tradition list is a short optional label, not a complete map of sampradayas.
- No push provider is selected. The saved notification booleans are intent only.
