# Decisions

Decisions for the first milestone. Each one can be reversed, but the next change should say why.

## ADR-001 — Start from an empty repository

The repository had a `.git` directory, no commits, and no source files. There was no framework, native project, or hosted backend to migrate. `create-expo-app` 5.0.0 wrote the Expo SDK 57 default template into this directory and did not create a second git repository.

Status: accepted.

## ADR-002 — Expo, React Native, and TypeScript strict mode

The client is Expo SDK 57, React Native 0.86, React 19.2, and TypeScript with `strict` enabled. The template's path alias `@/` points at `src`. ESLint uses the SDK 57 flat config. Prettier is the formatter: single quotes, trailing commas, width 100, LF line endings. Jest uses the `jest-expo/android` preset so tests run in the Android Jest environment rather than the preset's older iOS default.

Status: accepted.

## ADR-003 — Android is the only launch platform

Navigation, copy, and the runbook target Android. Portrait orientation is set. The Expo template's `ios` and `web` npm scripts are still present so the generated project stays intact. They are not product targets, and no web-only screens were kept.

Status: accepted. iOS remains out of scope until a later product decision.

## ADR-004 — Stable tabs, five sections, Settings on the stack

The template shipped `expo-router/unstable-native-tabs`. This shell uses the stable `Tabs` navigator from `expo-router`. Home, Horoscope, Panchang, Rituals, and Temples are tabs. Settings is a stack screen opened from Home, because a sixth tab is a poor fit on a narrow phone.

Status: accepted. Tab label length in Malayalam and Tamil still needs a check on a 360dp-wide device.

## ADR-005 — No invented religious output

Horoscope and Panchang functions return `status: 'unavailable'`. Ritual and temple lists return `[]`. The UI copy says the section is empty. Tests fail if a reading, a Panchang field, a ritual, or a temple appears. Rashi names in the picker are category labels, not predictions.

Status: accepted. This is a standing content rule, not only a shell rule.

## ADR-006 — Typed catalogs instead of an i18n library

Ten languages are compile-checked dictionaries. A missing key fails typecheck. Device language comes from `expo-localization`, with English as the fallback. `i18next` was not added. The catalogs are small, and a library can wait until the team needs plurals or remote copy.

The catalogs are an unreviewed draft. Native-speaker review is required before release.

Status: accepted for the shell. Revisit if copy moves into a CMS.

## ADR-007 — Rashi labels stay in transliteration for now

The picker shows forms such as "Mesha (Aries)" in every language. Localized Rashi names are real religious vocabulary and should be reviewed before they ship in Tamil, Malayalam, and the other catalogs. The screen tells the reader that local names are not loaded.

Status: accepted until a reviewer signs the names.

## ADR-008 — Optional Supabase, inactive in the shell

`@supabase/supabase-js` is installed. The client is created only when both public environment variables are non-empty, and the shell never calls that factory on launch. Sessions are not persisted. The Settings screen does not start a sign-in flow.

Status: accepted. Creating the Supabase project, its region, and its tables is a later decision. Data residency for users in India is part of that decision.

## ADR-009 — Preferences stay on the device

Language and Rashi id are stored in AsyncStorage. No account sync exists. The preference type has no birth fields, and the parser strips unknown keys.

Status: accepted.

## ADR-010 — Analytics is a no-op

No analytics SDK is installed. Events may carry a language code or a boolean for whether a Rashi is selected. They may not carry the Rashi id. Nothing is transmitted.

Status: accepted until a vendor and a privacy review exist.

## ADR-011 — Working title, application id, and scheme are provisional

- Display name: Spiritual Guidance
- npm package name: `spiritual-guidance`
- Android application id: `com.spiritualguidance.app`
- URL scheme: `spiritualguidance`
- Repository folder: `horosope_on_deand` (unchanged; it is only the git root)

None of these are a brand decision. The application id cannot be changed after the first Play upload. Confirm ownership before that upload.

Status: provisional.

## ADR-012 — Keep the template icon until a real mark exists

`assets/images/icon.png`, the adaptive icon, and the splash image are the Expo template artwork. They remain so the project still builds. They must be replaced before a public or store build. Expo's logo is not licensed as this app's trademark.

Status: accepted as a temporary build asset. Replacement is a release blocker.

## ADR-013 — System font, no embedded Latin font

Indic text uses the Android system font so Devanagari, Gujarati, Tamil, Malayalam, Kannada, Telugu, Bengali, and Gurmukhi render without a separate font license.

Status: accepted.

## Unresolved

These need a decision before the related feature is built.

| Topic                               | Why it is open                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product name                        | Working title only                                                                                                                                                    |
| Final application id and URL scheme | Required before Play upload and before OAuth redirects                                                                                                                |
| App license                         | No `LICENSE` file was added. Dependency licenses are not an app license                                                                                               |
| Supabase project, region, and plan  | No project has been created. Free projects pause after inactivity                                                                                                     |
| Panchang source                     | A client-side library such as Swiss Ephemeris is AGPL and needs a license review. A hosted API needs a contract and a cost check. The client must not invent the math |
| Horoscope editorial source          | Who writes a daily Rashi text, and who reviews it                                                                                                                     |
| Ritual reviewer                     | Who is allowed to approve steps, and where that approval is stored                                                                                                    |
| Temple directory                    | How entries are gathered and checked. Google Places terms restrict storing some place data                                                                            |
| Festival module                     | In the product vision, not started. Needs the same review rule as rituals                                                                                             |
| Scripture quotations                | Edition and translation copyright are unknown, so no verse is embedded                                                                                                |
| Localized Rashi names               | Deferred under ADR-007                                                                                                                                                |
| Native-speaker copy review          | Draft UI strings only                                                                                                                                                 |
| Analytics vendor                    | None selected                                                                                                                                                         |
| i18n library                        | Revisit if catalogs outgrow the typed dictionaries                                                                                                                    |
| Visual identity                     | Colors in `src/constants/theme.ts` are a readable placeholder, not a brand                                                                                            |
| DPDP notice                         | Required before email, phone, birth details, or precise location are collected                                                                                        |
| Personalized horoscope              | Out of scope. If it ever exists, it is a new product decision, not a hidden field on the general Rashi screen                                                         |
| Store build path                    | Local `expo run:android` versus EAS Build. EAS has a free tier and then usage charges                                                                                 |
| Ads and consent                     | Later phase. No SDK until the privacy decision exists                                                                                                                 |
