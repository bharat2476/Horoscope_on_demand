-- Daily Rashi readings. The client reads published rows only.
-- No prediction is seeded. A development example must not be inserted as published.

create table content.daily_readings (
  id uuid primary key,
  canonical_id uuid references content.daily_readings (id),
  civil_date date not null,
  rashi_id text not null check (
    rashi_id in (
      'mesha', 'vrishabha', 'mithuna', 'karka', 'simha', 'kanya',
      'tula', 'vrishchika', 'dhanu', 'makara', 'kumbha', 'meena'
    )
  ),
  language text not null check (
    language in ('en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa')
  ),
  version integer not null check (version > 0),
  tradition text not null check (length(btrim(tradition)) > 0),
  status text not null check (
    status in ('draft', 'in-review', 'approved', 'rejected', 'published', 'retired')
  ),
  assistance text not null default 'none' check (assistance in ('none', 'ai-draft')),
  development_example boolean not null default false,
  created_by uuid not null,
  reviewer_id uuid,
  review_date date,
  published_at timestamptz,
  body jsonb not null,
  sources jsonb not null,
  constraint published_daily_review check (
    status <> 'published'
    or (
      reviewer_id is not null
      and reviewer_id <> created_by
      and review_date is not null
      and published_at is not null
      and development_example = false
    )
  ),
  constraint daily_sections check (
    length(btrim(coalesce(body ->> 'outlook', ''))) > 0
    and length(btrim(coalesce(body ->> 'family', ''))) > 0
    and length(btrim(coalesce(body ->> 'career', ''))) > 0
    and length(btrim(coalesce(body ->> 'finance', ''))) > 0
    and length(btrim(coalesce(body ->> 'financeEducation', ''))) > 0
    and length(btrim(coalesce(body ->> 'action', ''))) > 0
  ),
  constraint no_forbidden_daily_claim check (
    body::text !~* 'guaranteed returns|stock pick|financial freedom|must donate'
  ),
  unique (civil_date, rashi_id, language, version)
);

create unique index one_published_daily_rashi
  on content.daily_readings (civil_date, rashi_id, language)
  where status = 'published';

alter table content.daily_readings enable row level security;

create trigger daily_readings_no_direct_write
before insert or update or delete on content.daily_readings
for each row execute function content.block_direct_write();

create view public.published_daily_rashis
with (security_barrier = true, security_invoker = false) as
select
  id,
  canonical_id,
  civil_date,
  rashi_id,
  language,
  version,
  tradition,
  body,
  sources,
  published_at
from content.daily_readings
where status = 'published' and development_example = false;

revoke all on content.daily_readings from public, anon, authenticated, service_role;
revoke all on table public.published_daily_rashis from public, service_role;
grant select on table public.published_daily_rashis to anon, authenticated;
