# Supabase setup

The app already uses `@supabase/supabase-js`. The Android client is created only when both public variables are set. It never receives the service-role key.

## Variables

Set these for local `npx expo start`. Copy `.env.example` to `.env`. Leave the values empty to run without a database.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

An EAS Android build does not read the `.env` file on your laptop. Set the same two names in the EAS environment for that build profile. Do not add `SUPABASE_SERVICE_ROLE_KEY` to the app or to any `EXPO_PUBLIC_` variable. Keep that key on a trusted server if you later call `content.upsert_panchang_cache`.

## Apply migrations

Run them in this order on the existing project. Do not reset the database.

1. `supabase/migrations/20261014120000_content_review.sql`
2. `supabase/migrations/20261014140000_private_preferences.sql`
3. `supabase/migrations/20261014160000_private_preferences_checks.sql`
4. `supabase/migrations/20261015120000_daily_rashi.sql`
5. `supabase/migrations/20261015210000_public_catalog_cache.sql`
6. `supabase/migrations/20261016213000_language_editions.sql`

`20261016213000_language_editions.sql` adds `content.language_editions` and three published edition views. It does not change existing tables. Apply it only after the content review migration is present.

`20261014180000_live_puja.sql` and `20261016120000_private_charts.sql` are in the folder and are not part of this apply list. If a hosted project already has them, leave them in place.

In the Supabase SQL editor, open each file and run it once. If a file was already applied, skip it. These files do not delete existing rows.

With the Supabase CLI linked to this project, `supabase db push` applies pending files in that order. Do not run `supabase db reset`.

## Who can write

Anonymous and signed-in clients can select the public views of published rows. They cannot insert into `content.documents`, `content.daily_readings`, or `content.panchang_cache`.

A reviewer write uses the database role `content_staff`, with `content.workflow` set to `on` and `content.actor_id` set to a user who has a row in `content.grants`. Publishing a Panchang cache row also requires the `publish` grant and `license_allows_cache = true` only when the provider terms allow the cache. No provider is connected in the app.

`public.private_preferences` remains one row per signed-in user. Anonymous clients have no policy on it.

## Panchang cache

The public view returns a row only when `license_allows_cache` is true. The app labels a row stale when `freshness` is not `current` or when `expires_at` is in the past. It does not calculate a replacement value.

## Priest records

`puja.priests` stays private. This migration does not add a public priest directory. Illustrations in the app are local files, not Supabase Storage objects.

The existing puja seed allows 12 and 24 hours of notice for two services, and 48 hours for Havan. This change does not alter those booking rules.
