# Product requirements

Working title: Spiritual Guidance. The name is not final.

Audience: people in India who want a daily Hindu calendar and Rashi horoscope, ritual guidance they can trust, and a directory of Mataji temples. The business aims are audience growth, daily return visits, and advertising revenue later. Advertising is not part of this milestone.

Launch platform: Android only.

## Problem

General Rashi horoscopes are often mixed with birth-chart products that demand a birth date, birth time, and birthplace before showing anything. Panchang apps often disagree because the calculation source is hidden. Ritual and temple content on the open web is frequently unsourced. This product should be usable without an account, specific about place and time for Panchang, and unwilling to display religious content that has not been reviewed.

## This milestone

This milestone delivers a foundation the team can review before content work starts.

Included:

- An installable Expo application shell with navigation.
- Placeholder screens for Home, Horoscope, Panchang, Rituals, Temples, and Settings.
- Language selection for English, Hindi, Gujarati, Tamil, Malayalam, Marathi, Kannada, Telugu, Bengali, and Punjabi.
- A saved Rashi preference that does not produce a reading.
- Optional authentication plumbing that stays inactive until Supabase public configuration exists.
- Project rules that block invented Panchang values, horoscope text, ritual steps, temple facts, and scripture citations.

A person can open the app, change language, select a Rashi, and move between sections. Every content section tells them that nothing is available yet.

## Not in this milestone

- Daily horoscope copy, lucky numbers, scores, or compatibility.
- Any Panchang element, including tithi, nakshatra, yoga, karana, sunrise, or rahukaal.
- Festival calendars. Festivals are part of the product vision and need their own reviewed source before a module is added.
- Ritual steps, mantras, or how-to guides.
- Temple names, addresses, hours, or map pins.
- Birth date, birth time, or birthplace collection. A general Rashi horoscope must never require them.
- Accounts, cross-device sync, password reset, and profile screens.
- Push notifications, ads, YouTube embeds, paid consultations, and a priest marketplace.
- A website or a separate backend service. Supabase, when configured later, is the backend.

## Product rules

1. Public reading works with no login.
2. Sign-in is optional and exists to carry preferences to another device, not to unlock the daily horoscope.
3. The app never fabricates a religious fact to fill an empty state.
4. Panchang, when it exists, is for a specific civil date, latitude, longitude, and IANA time zone. It is not a single nationwide value, and it is not hard-coded to one city.
5. Rituals appear only after a named review. The reviewer and the review record are product requirements for that later milestone, not for this shell.
6. Temple rows come from a curated directory. A scraped or unreviewed listing is not acceptable.
7. Interface copy in all ten languages needs native-speaker review before release. The current catalogs are a draft.

## Later phases, in order

1. Choose the content sources and the review workflow. No screen should start showing data before this.
2. Ship reviewed daily Rashi text and a real Panchang for the user's chosen place.
3. Ship reviewed rituals, festivals, and the Mataji directory.
4. Add optional accounts and cross-device preferences.
5. Add notifications only for content the user asked to be reminded about.
6. Add advertising only after a privacy review. Ads must not receive precise location or an identified religious profile as a targeting input unless a separate consent decision allows it.
7. Paid services and a priest marketplace stay out of the product until the free content is trusted.

## Success, later

Not measured in this milestone. The intended signals, once content exists, are daily active use of Panchang and horoscope, return rate, and time on reviewed content. This shell has no analytics vendor, so it cannot report those numbers.
