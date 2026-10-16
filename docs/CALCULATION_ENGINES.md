# Calculation engines

Fusion Strings and VedAstro are server-side candidates. The public Panchang and Rashi screens still show an empty state. Neither engine's output is marked verified.

## Fusion Strings Panchangam

- Package: `@fusionstrings/panchangam` 0.2.0
- Call used: `calculate_daily_panchang(year, month, day, location, ayanMode)`
- Lahiri is mode `1` (`AyanamshaMode.Lahiri`)
- Reported Swiss Ephemeris version: 2.10.03
- Node can load the included Wasm file. Rust and Deno are not required for that package.
- Supabase Edge Functions were not used. Rust and Deno are not installed here, so a Wasm build inside an Edge Function was not tested.
- The wrapper license field is MIT. The library embeds Swiss Ephemeris. A closed-source Play Store app still needs Astrodienst's position on commercial use before release. The Android app does not import this package.

The daily call returns tithi, nakshatra, yoga, karana, sunrise, sunset, weekday, Rahu Kalam, Yamaganda, and Gulika, with start and end timestamps. It does not accept a birth chart. Its ascendant field is the sunrise ascendant, not a birth lagna.

House codes in the same package, not used for the daily record: `W` whole sign, `P` Placidus, `E` equal. The Vedic default for a later chart call is whole sign.

## VedAstro

- Base URL: `https://api.vedastro.org/api`
- Documented time form: `HH:MM DD/MM/YYYY ±HH:MM`
- This adapter sends `Ayanamsa/LAHIRI` on every call. VedAstro's own default is RAMAN.
- A live `AllPlanetRasiSigns` call on 16 October 2026 returned `Status: Pass` and echoed `"Ayanamsa": 1`. That call is not an independent accuracy check.
- `LagnaSign` returned `Calculator method not found`. Birth lagna is not wired until a documented method is confirmed.
- Documented and implemented for parsing: `AllPlanetRasiSigns`, and the `DasaAtTime` response shape. `PlanetNavamsaD9Sign` is documented by the maintainer and is not called yet.
- `HoroscopePredictions` is not called. Those texts are interpretations, and sample text includes fear-based claims.
- Free tier: 5 requests a minute, no key. Premium is listed by VedAstro at $1 per month. The key name is `VEDASTRO_API_KEY` on the server only.
- Their FAQ says both tiers allow commercial use. That statement was not matched to a Swiss Ephemeris license grant.

## What is still closed

- No Panchang value is shown as current.
- No chart is stored as verified. `chart.calculations` rejects `verified = true`.
- Apply `supabase/migrations/20261016120000_private_charts.sql` only when you want that private table. It was not applied from here.
- Birth date, time, coordinates, and the offset in force must be supplied by the caller. This app does not look up a historical time zone.
