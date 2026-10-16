-- Private chart calculations. Anonymous clients cannot read or write this table.
-- verified stays false until a later migration after an independent reference check.
-- Birth details are not copied into public content tables.

create schema if not exists chart;

create table chart.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  engine text not null check (engine in ('fusion-strings', 'vedastro')),
  engine_version text,
  ephemeris_version text,
  ayanamsa text not null check (ayanamsa in ('lahiri', 'raman', 'krishnamurti')),
  house_system text not null check (house_system in ('whole-sign', 'placidus', 'equal', 'not-applicable')),
  calculated_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  time_zone text not null,
  utc_offset text not null,
  birth_local text not null,
  result jsonb not null,
  verified boolean not null default false,
  constraint chart_not_verified check (verified = false),
  constraint chart_no_public_birth_copy check (not (result ? 'status' and result ? 'review'))
);

alter table chart.calculations enable row level security;

revoke all on chart.calculations from public, anon, authenticated, service_role;
