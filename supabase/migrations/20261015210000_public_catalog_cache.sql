-- Additive public catalog and Panchang cache.
-- Does not remove or rewrite existing rows.
--
-- Existing tables stay the source of truth:
--   rashi_daily_content  -> content.daily_readings, read through public.published_daily_rashis
--   rituals, festivals, temples -> content.documents, read through the published_* views
--   revision history -> content.revisions (staff only; no anonymous access)
--   user preferences -> public.private_preferences (owner row only)
--   priests -> puja.priests (no public directory; this file does not expose it)
--
-- Anonymous clients receive select on the public views below and nothing else.
-- Writes use content_staff, content.workflow = on, and content.actor_id.

create table content.rashis (
  id text primary key check (
    id in (
      'mesha', 'vrishabha', 'mithuna', 'karka', 'simha', 'kanya',
      'tula', 'vrishchika', 'dhanu', 'makara', 'kumbha', 'meena'
    )
  ),
  transliteration text not null,
  sanskrit text not null,
  symbol text not null,
  created_at timestamptz not null default now()
);

alter table content.rashis enable row level security;

create trigger rashis_no_direct_write
before insert or update or delete on content.rashis
for each row execute function content.block_direct_write();

-- Category labels already shipped in the app. No horoscope text is inserted.
select set_config('content.workflow', 'on', true);
insert into content.rashis (id, transliteration, sanskrit, symbol)
values
  ('mesha', 'Mesha (Aries)', 'मेष', 'मेष'),
  ('vrishabha', 'Vrishabha (Taurus)', 'वृषभ', 'वृषभ'),
  ('mithuna', 'Mithuna (Gemini)', 'मिथुन', 'मिथुन'),
  ('karka', 'Karka (Cancer)', 'कर्क', 'कर्क'),
  ('simha', 'Simha (Leo)', 'सिंह', 'सिंह'),
  ('kanya', 'Kanya (Virgo)', 'कन्या', 'कन्या'),
  ('tula', 'Tula (Libra)', 'तुला', 'तुला'),
  ('vrishchika', 'Vrishchika (Scorpio)', 'वृश्चिक', 'वृश्चिक'),
  ('dhanu', 'Dhanu (Sagittarius)', 'धनु', 'धनु'),
  ('makara', 'Makara (Capricorn)', 'मकर', 'मकर'),
  ('kumbha', 'Kumbha (Aquarius)', 'कुम्भ', 'कुम्भ'),
  ('meena', 'Meena (Pisces)', 'मीन', 'मीन')
on conflict (id) do nothing;
select set_config('content.workflow', 'off', true);

create view public.rashis
with (security_barrier = true, security_invoker = false) as
select id, transliteration, sanskrit, symbol
from content.rashis;

revoke all on content.rashis from public, anon, authenticated, service_role;
revoke all on table public.rashis from public, service_role;
grant select on table public.rashis to anon, authenticated;

create table content.panchang_cache (
  id uuid primary key default gen_random_uuid(),
  civil_date date not null,
  city_id text not null,
  time_zone text not null,
  convention text not null,
  provider_id text not null,
  payload jsonb not null,
  retrieved_at timestamptz not null,
  expires_at timestamptz not null,
  freshness text not null check (freshness in ('current', 'stale', 'expired')),
  license_allows_cache boolean not null default false,
  created_at timestamptz not null default now(),
  constraint panchang_no_birth check (
    not (
      payload ? 'birthDate'
      or payload ? 'birthTime'
      or payload ? 'birthPlace'
      or payload ? 'birthplace'
      or payload ? 'birth_date'
      or payload ? 'birth_time'
      or payload ? 'birth_place'
    )
  ),
  unique (civil_date, city_id, time_zone, convention, provider_id)
);

create index panchang_cache_lookup
  on content.panchang_cache (city_id, civil_date);

alter table content.panchang_cache enable row level security;

create trigger panchang_cache_no_direct_write
before insert or update or delete on content.panchang_cache
for each row execute function content.block_direct_write();

-- Rows whose license forbids caching stay out of the public view.
-- The client must still relabel a past expiry as stale.
create view public.panchang_cache_public
with (security_barrier = true, security_invoker = false) as
select
  civil_date,
  city_id,
  time_zone,
  convention,
  provider_id,
  payload,
  retrieved_at,
  expires_at,
  freshness
from content.panchang_cache
where license_allows_cache = true;

revoke all on content.panchang_cache from public, anon, authenticated, service_role;
revoke all on table public.panchang_cache_public from public, service_role;
grant select on table public.panchang_cache_public to anon, authenticated;

create or replace function content.upsert_panchang_cache(
  p_civil_date date,
  p_city_id text,
  p_time_zone text,
  p_convention text,
  p_provider_id text,
  p_payload jsonb,
  p_retrieved_at timestamptz,
  p_expires_at timestamptz,
  p_freshness text,
  p_license_allows_cache boolean
)
returns void
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid;
begin
  if current_setting('content.workflow', true) is distinct from 'on' then
    raise exception 'editor session required';
  end if;
  actor := content.editor_actor();
  if not content.has_grant(actor, 'publish') then
    raise exception 'missing permission';
  end if;
  if p_freshness not in ('current', 'stale', 'expired') then
    raise exception 'invalid freshness';
  end if;
  perform set_config('content.workflow', 'on', true);
  insert into content.panchang_cache (
    civil_date, city_id, time_zone, convention, provider_id, payload,
    retrieved_at, expires_at, freshness, license_allows_cache
  )
  values (
    p_civil_date, p_city_id, p_time_zone, p_convention, p_provider_id, p_payload,
    p_retrieved_at, p_expires_at, p_freshness, p_license_allows_cache
  )
  on conflict (civil_date, city_id, time_zone, convention, provider_id)
  do update set
    payload = excluded.payload,
    retrieved_at = excluded.retrieved_at,
    expires_at = excluded.expires_at,
    freshness = excluded.freshness,
    license_allows_cache = excluded.license_allows_cache;
end;
$$;

revoke all on function content.upsert_panchang_cache(
  date, text, text, text, text, jsonb, timestamptz, timestamptz, text, boolean
) from public, anon, authenticated, service_role;
grant execute on function content.upsert_panchang_cache(
  date, text, text, text, text, jsonb, timestamptz, timestamptz, text, boolean
) to content_staff;

-- Published edition metadata only. Reviewer notes and draft bodies stay off this view.
create view public.published_content_editions
with (security_barrier = true, security_invoker = false) as
select
  kind as content_type,
  id as content_id,
  null::text as language,
  null::integer as version,
  status,
  published_at
from content.documents
where status = 'published'
union all
select
  'daily-rashi' as content_type,
  id as content_id,
  language,
  version,
  status,
  published_at
from content.daily_readings
where status = 'published' and development_example = false;

revoke all on table public.published_content_editions from public, service_role;
grant select on table public.published_content_editions to anon, authenticated;
