# Store listing requirements

Nothing in this file has been entered in Play Console. None of it is a policy approval.

## Listing fields still missing

- App name confirmation. The in-app name is Spiritual Guidance.
- Short description and full description in each language that will be listed. English source copy exists in the app. Indic catalogs are drafts.
- Feature graphic, phone screenshots, and a 7-inch or 10-inch tablet screenshot if that device class is supported.
- An app icon that is not the Expo template. `assets/images/icon.png` and the adaptive icon are still the stock Expo artwork.
- A privacy-policy URL. `docs/PRIVACY.md` is the source text. It is not hosted.
- A support email or website. None is assigned.
- A web page where a person can request account deletion, required if the app allows account creation. The in-app delete action exists only when Supabase is configured, and it has not been executed against a hosted project.
- Content rating questionnaire, ads declaration (this build has no ads SDK), and news or religious-content questions in Play Console.
- Data safety form. Use the draft in `docs/PRIVACY.md`. Tradition is an optional religious label once it is copied to an account.
- Target API 36 in the uploaded AAB. Required for a new app submitted after 31 August 2026. An extension to 1 November 2026 is described by Google as a Console request, not something this repository can claim. Source: [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878).

## Closed testing

The Play account that will own this app is not recorded here, so the testing rule that applies to it is not verified.

Google's published rule, read on 14 October 2026, is:

- A personal Play Console account created after 13 November 2023 must run a closed test before applying for production. At least 12 testers must be opted in, continuously, for the 14 days before that application. An invitation is not an opt-in. Internal testing alone does not meet this rule.
- Organization accounts, and personal accounts created earlier, follow a different path. Check the Dashboard in Play Console for the account that will be used.
- Google also asks about tester engagement when production access is requested. Meeting the count of 12 is not, by itself, an approval.
- The first public release should be a closed-track AAB uploaded by a person. This repository does not upload it.

Sources: [App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465) and [Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334).

## Account deletion on the store

If account creation ships, Play requires both an in-app deletion path and a web link, and deletion must remove the account and its app data. Freezing the account does not qualify. Source: [User Data](https://support.google.com/googleplay/android-developer/answer/10144311). The web link is still missing.
