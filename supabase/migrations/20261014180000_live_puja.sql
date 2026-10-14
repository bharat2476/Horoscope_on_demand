-- Family-only live puja bookings.
-- Anonymous clients can read the published service view and nothing else.
-- Priest contact details, verification documents, and family ritual details stay in puja.
-- The service-role key is not granted table access. A trusted server may execute
-- puja_apply_payment_event only, and that function still checks the webhook secret.

create schema if not exists puja;
create schema if not exists auth;

create extension if not exists btree_gist;

create table if not exists auth.users (
  id uuid primary key
);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'auth' and pg_proc.proname = 'uid'
  ) then
    create function auth.uid()
    returns uuid
    language sql
    stable
    as $fn$
      select null::uuid;
    $fn$;
  end if;
end
$$;

create table puja.services (
  id uuid primary key,
  slug text not null unique,
  status text not null check (status in ('draft', 'published', 'retired')),
  title text not null,
  description text not null,
  preparation text not null,
  price_paise integer not null check (price_paise >= 0),
  currency text not null check (currency = 'INR'),
  duration_minutes integer not null check (duration_minutes > 0),
  languages text[] not null check (cardinality(languages) > 0),
  min_advance_hours integer not null check (min_advance_hours >= 0),
  required_family_fields text[] not null default '{}',
  constraint havan_advance check (slug <> 'havan-homa' or min_advance_hours >= 48),
  constraint required_fields_known check (
    required_family_fields <@ array['householdName', 'gotra', 'sankalpName', 'nakshatra']::text[]
  )
);

create table puja.priests (
  id uuid primary key,
  user_id uuid unique references auth.users (id) on delete restrict,
  display_name text not null,
  verification_status text not null check (
    verification_status in ('pending', 'vetted', 'suspended', 'retired')
  ),
  operational_status text not null check (
    operational_status in ('active', 'inactive', 'suspended')
  ),
  languages text[] not null,
  contact_email text,
  contact_phone text,
  documents jsonb not null default '{}'::jsonb
);

create table puja.priest_services (
  priest_id uuid not null references puja.priests (id) on delete cascade,
  service_id uuid not null references puja.services (id) on delete cascade,
  primary key (priest_id, service_id)
);

create table puja.priest_availability (
  id uuid primary key default gen_random_uuid(),
  priest_id uuid not null references puja.priests (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at)
);

create table puja.actors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kind text not null check (kind in ('admin', 'priest')),
  priest_id uuid unique references puja.priests (id) on delete cascade,
  active boolean not null default true,
  constraint priest_actor_has_priest check (
    (kind = 'priest' and priest_id is not null) or (kind = 'admin' and priest_id is null)
  )
);

create table puja.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users (id) on delete restrict,
  anonymized_at timestamptz,
  service_id uuid not null references puja.services (id),
  status text not null check (
    status in (
      'pending_payment',
      'pending_assignment',
      'confirmed',
      'rescheduled',
      'cancelled',
      'in_progress',
      'completed',
      'no_show',
      'refund_pending',
      'refunded'
    )
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  time_zone text not null,
  language text not null,
  price_paise integer not null check (price_paise >= 0),
  currency text not null check (currency = 'INR'),
  preferred_priest_id uuid references puja.priests (id),
  assigned_priest_id uuid references puja.priests (id),
  preferred_unavailable boolean not null default false,
  session_kind text not null default 'private_family' check (session_kind = 'private_family'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_has_owner check (customer_id is not null or anonymized_at is not null),
  constraint puja_priest_no_overlap exclude using gist (
    assigned_priest_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (
    assigned_priest_id is not null
    and status in ('confirmed', 'rescheduled', 'in_progress')
  )
);

create table puja.family_details (
  booking_id uuid primary key references puja.bookings (id) on delete cascade,
  household_name text,
  gotra text,
  sankalp_name text,
  nakshatra text
);

create table puja.session_participants (
  booking_id uuid not null references puja.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (booking_id, user_id)
);

create table puja.recording_consents (
  booking_id uuid not null references puja.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  consented_at timestamptz not null default now(),
  primary key (booking_id, user_id)
);

create table puja.sessions (
  booking_id uuid primary key references puja.bookings (id) on delete cascade,
  recording_requested boolean not null default false
);

create table puja.preferred_priests (
  customer_id uuid primary key references auth.users (id) on delete cascade,
  priest_id uuid not null references puja.priests (id),
  source_booking_id uuid not null references puja.bookings (id),
  saved_at timestamptz not null default now()
);

create table puja.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references puja.bookings (id) on delete cascade,
  customer_id uuid references auth.users (id) on delete restrict,
  priest_id uuid not null references puja.priests (id),
  rating integer not null check (rating between 1 and 5),
  feedback text,
  issue_categories text[] not null default '{}',
  hidden boolean not null default false,
  edit_count integer not null default 0 check (edit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table puja.payment_events (
  provider text not null,
  event_id text not null,
  event_type text not null check (event_type in ('payment.captured', 'payment.failed', 'refund.processed')),
  booking_id uuid references puja.bookings (id),
  amount_paise integer not null,
  currency text not null,
  result text not null check (result in ('applied', 'rejected', 'unassigned')),
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create table puja.notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references puja.bookings (id) on delete cascade,
  kind text not null,
  dedupe_key text not null unique,
  time_zone text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table puja.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_kind text not null,
  action text not null,
  booking_id uuid,
  priest_id uuid,
  detail jsonb not null default '{}'::jsonb
);

create table puja.runtime_config (
  key text primary key,
  value text not null
);

create index bookings_customer_idx on puja.bookings (customer_id, created_at desc);
create index bookings_priest_idx on puja.bookings (assigned_priest_id, starts_at);

alter table puja.services enable row level security;
alter table puja.priests enable row level security;
alter table puja.priest_services enable row level security;
alter table puja.priest_availability enable row level security;
alter table puja.actors enable row level security;
alter table puja.bookings enable row level security;
alter table puja.family_details enable row level security;
alter table puja.session_participants enable row level security;
alter table puja.recording_consents enable row level security;
alter table puja.sessions enable row level security;
alter table puja.preferred_priests enable row level security;
alter table puja.reviews enable row level security;
alter table puja.payment_events enable row level security;
alter table puja.notifications enable row level security;
alter table puja.audit_log enable row level security;
alter table puja.runtime_config enable row level security;

create or replace function puja.is_admin(actor uuid)
returns boolean
language sql
stable
security definer
set search_path = puja, public
as $$
  select exists (
    select 1 from puja.actors
    where user_id = actor and kind = 'admin' and active
  );
$$;

create or replace function puja.audit(
  p_actor uuid,
  p_kind text,
  p_action text,
  p_booking uuid,
  p_priest uuid,
  p_detail jsonb
)
returns void
language sql
security definer
set search_path = puja, public
as $$
  insert into puja.audit_log (actor_id, actor_kind, action, booking_id, priest_id, detail)
  values (p_actor, p_kind, p_action, p_booking, p_priest, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function puja.enqueue_notice(p_booking_id uuid, p_kind text, p_when timestamptz)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  booking puja.bookings;
begin
  select * into booking from puja.bookings where id = p_booking_id;
  if not found then
    return;
  end if;
  if p_when <= now() and p_kind in ('reminder_24h', 'reminder_1h', 'join_instructions') then
    return;
  end if;
  insert into puja.notifications (booking_id, kind, dedupe_key, time_zone, scheduled_for)
  values (
    booking.id,
    p_kind,
    booking.id::text || ':' || p_kind || ':' || booking.starts_at::text,
    booking.time_zone,
    p_when
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

create or replace function puja.transition_allowed(p_from text, p_to text, p_actor text)
returns boolean
language sql
immutable
as $$
  select case
    when p_from = 'pending_payment' and p_to = 'pending_assignment' and p_actor in ('payment_webhook', 'admin') then true
    when p_from = 'pending_payment' and p_to = 'cancelled' and p_actor in ('customer', 'admin', 'payment_webhook') then true
    when p_from = 'pending_assignment' and p_to = 'confirmed' and p_actor in ('system', 'admin') then true
    when p_from = 'pending_assignment' and p_to = 'cancelled' and p_actor in ('customer', 'admin') then true
    when p_from = 'pending_assignment' and p_to = 'refund_pending' and p_actor in ('admin', 'system') then true
    when p_from = 'confirmed' and p_to = 'rescheduled' and p_actor in ('customer', 'admin', 'priest') then true
    when p_from = 'confirmed' and p_to = 'cancelled' and p_actor in ('customer', 'admin') then true
    when p_from = 'confirmed' and p_to = 'in_progress' and p_actor in ('priest', 'admin', 'system') then true
    when p_from = 'confirmed' and p_to = 'no_show' and p_actor in ('priest', 'admin') then true
    when p_from = 'confirmed' and p_to = 'refund_pending' and p_actor in ('admin') then true
    when p_from = 'rescheduled' and p_to = 'confirmed' and p_actor in ('system', 'admin') then true
    when p_from = 'rescheduled' and p_to = 'cancelled' and p_actor in ('customer', 'admin') then true
    when p_from = 'rescheduled' and p_to = 'in_progress' and p_actor in ('priest', 'admin') then true
    when p_from = 'rescheduled' and p_to = 'no_show' and p_actor in ('priest', 'admin') then true
    when p_from = 'rescheduled' and p_to = 'refund_pending' and p_actor in ('admin') then true
    when p_from = 'in_progress' and p_to = 'completed' and p_actor in ('priest', 'admin') then true
    when p_from = 'in_progress' and p_to = 'no_show' and p_actor in ('priest', 'admin') then true
    when p_from = 'in_progress' and p_to = 'refund_pending' and p_actor in ('admin') then true
    when p_from = 'cancelled' and p_to = 'refund_pending' and p_actor in ('admin', 'system', 'payment_webhook') then true
    when p_from = 'no_show' and p_to = 'refund_pending' and p_actor in ('admin') then true
    when p_from = 'refund_pending' and p_to = 'refunded' and p_actor in ('payment_webhook', 'admin') then true
    else false
  end;
$$;

create or replace function puja.priest_is_eligible(
  p_priest_id uuid,
  p_service_id uuid,
  p_language text,
  p_starts timestamptz,
  p_ends timestamptz,
  p_ignore_booking uuid
)
returns boolean
language sql
stable
security definer
set search_path = puja, public
as $$
  select exists (
    select 1
    from puja.priests priest
    join puja.priest_services qualification
      on qualification.priest_id = priest.id and qualification.service_id = p_service_id
    where priest.id = p_priest_id
      and priest.verification_status = 'vetted'
      and priest.operational_status = 'active'
      and p_language = any (priest.languages)
      and exists (
        select 1 from puja.priest_availability availability
        where availability.priest_id = priest.id
          and availability.starts_at <= p_starts
          and availability.ends_at >= p_ends
      )
      and not exists (
        select 1 from puja.bookings other
        where other.assigned_priest_id = priest.id
          and other.id is distinct from p_ignore_booking
          and other.status in ('confirmed', 'rescheduled', 'in_progress')
          and tstzrange(other.starts_at, other.ends_at, '[)') && tstzrange(p_starts, p_ends, '[)')
      )
  );
$$;

create or replace function puja.assign_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  booking puja.bookings;
  candidate uuid;
  chosen uuid;
begin
  select * into booking from puja.bookings where id = p_booking_id for update;
  if not found or booking.status not in ('pending_assignment', 'rescheduled') then
    raise exception 'invalid transition';
  end if;
  if not puja.transition_allowed(booking.status, 'confirmed', 'system') then
    raise exception 'invalid transition';
  end if;

  for candidate in
    select priest.id
    from puja.priests priest
    where puja.priest_is_eligible(
      priest.id,
      booking.service_id,
      booking.language,
      booking.starts_at,
      booking.ends_at,
      booking.id
    )
    order by (priest.id = booking.preferred_priest_id) desc, priest.id
    for update of priest
  loop
    begin
      update puja.bookings
      set
        assigned_priest_id = candidate,
        status = 'confirmed',
        preferred_unavailable = (
          booking.preferred_priest_id is not null and candidate is distinct from booking.preferred_priest_id
        ),
        updated_at = now()
      where id = booking.id;
      chosen := candidate;
      exit;
    exception
      when exclusion_violation then
        chosen := null;
    end;
  end loop;

  if chosen is null then
    raise exception 'no priest available';
  end if;

  perform puja.audit(
    null,
    'system',
    'assign',
    booking.id,
    chosen,
    jsonb_build_object(
      'preferred_unavailable',
      booking.preferred_priest_id is not null and chosen is distinct from booking.preferred_priest_id
    )
  );
  perform puja.enqueue_notice(booking.id, 'booking_confirmed', now());
  perform puja.enqueue_notice(booking.id, 'priest_assigned', now());
  if booking.preferred_priest_id is not null and chosen is distinct from booking.preferred_priest_id then
    perform puja.enqueue_notice(booking.id, 'priest_fallback', now());
  end if;
  perform puja.enqueue_notice(booking.id, 'reminder_24h', booking.starts_at - interval '24 hours');
  perform puja.enqueue_notice(booking.id, 'reminder_1h', booking.starts_at - interval '1 hour');
  perform puja.enqueue_notice(booking.id, 'join_instructions', booking.starts_at - interval '15 minutes');
  return chosen;
end;
$$;

create or replace function puja.field_present(p_family jsonb, p_field text)
returns boolean
language sql
immutable
as $$
  select length(btrim(coalesce(p_family ->> p_field, ''))) > 0;
$$;

create or replace function puja.create_booking(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_time_zone text,
  p_language text,
  p_family jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  service puja.services;
  preferred uuid;
  new_id uuid := gen_random_uuid();
  required text;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  select * into service from puja.services where id = p_service_id and status = 'published';
  if not found then
    raise exception 'service unavailable';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_time_zone) then
    raise exception 'invalid timezone';
  end if;
  if p_starts_at < now() + make_interval(hours => service.min_advance_hours) then
    raise exception 'advance booking required';
  end if;
  if not p_language = any (service.languages) then
    raise exception 'language unsupported';
  end if;
  foreach required in array service.required_family_fields loop
    if not puja.field_present(p_family, required) then
      raise exception 'missing family field';
    end if;
  end loop;

  select priest_id into preferred from puja.preferred_priests where customer_id = actor;

  insert into puja.bookings (
    id, customer_id, service_id, status, starts_at, ends_at, time_zone, language,
    price_paise, currency, preferred_priest_id, session_kind
  )
  values (
    new_id,
    actor,
    service.id,
    'pending_payment',
    p_starts_at,
    p_starts_at + make_interval(mins => service.duration_minutes),
    p_time_zone,
    p_language,
    service.price_paise,
    service.currency,
    preferred,
    'private_family'
  );
  insert into puja.family_details (booking_id, household_name, gotra, sankalp_name, nakshatra)
  values (
    new_id,
    nullif(btrim(coalesce(p_family ->> 'householdName', '')), ''),
    nullif(btrim(coalesce(p_family ->> 'gotra', '')), ''),
    nullif(btrim(coalesce(p_family ->> 'sankalpName', '')), ''),
    nullif(btrim(coalesce(p_family ->> 'nakshatra', '')), '')
  );
  perform puja.audit(actor, 'customer', 'create', new_id, null, jsonb_build_object('service', service.slug));
  perform puja.enqueue_notice(new_id, 'booking_receipt', now());
  return jsonb_build_object(
    'bookingId', new_id,
    'status', 'pending_payment',
    'pricePaise', service.price_paise,
    'currency', service.currency
  );
end;
$$;

create or replace function puja.apply_payment_event(
  p_secret text,
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_booking_id uuid,
  p_amount_paise integer,
  p_currency text
)
returns text
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  expected text;
  existing text;
  booking puja.bookings;
  inserted integer;
begin
  select value into expected from puja.runtime_config where key = 'payment_webhook_secret';
  if expected is null or p_secret is distinct from expected then
    raise exception 'rejected';
  end if;
  if p_event_type not in ('payment.captured', 'payment.failed', 'refund.processed') then
    raise exception 'rejected';
  end if;

  select result into existing
  from puja.payment_events
  where provider = p_provider and event_id = p_event_id;
  if found then
    return 'duplicate';
  end if;

  select * into booking from puja.bookings where id = p_booking_id for update;
  if not found then
    insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
    values (p_provider, p_event_id, p_event_type, null, p_amount_paise, p_currency, 'rejected')
    on conflict do nothing;
    return 'rejected';
  end if;
  if p_amount_paise is distinct from booking.price_paise or p_currency is distinct from booking.currency then
    insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
    values (p_provider, p_event_id, p_event_type, booking.id, p_amount_paise, p_currency, 'rejected')
    on conflict do nothing;
    return 'rejected';
  end if;

  if p_event_type = 'payment.captured'
    and puja.transition_allowed(booking.status, 'pending_assignment', 'payment_webhook')
  then
    update puja.bookings set status = 'pending_assignment', updated_at = now() where id = booking.id;
    perform puja.audit(null, 'payment_webhook', 'payment_captured', booking.id, null, '{}'::jsonb);
    perform puja.enqueue_notice(booking.id, 'payment_status', now());
    begin
      perform puja.assign_booking(booking.id);
    exception
      when raise_exception then
        if sqlerrm <> 'no priest available' then
          raise;
        end if;
        insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
        values (p_provider, p_event_id, p_event_type, booking.id, p_amount_paise, p_currency, 'unassigned');
        return 'unassigned';
    end;
    insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
    values (p_provider, p_event_id, p_event_type, booking.id, p_amount_paise, p_currency, 'applied');
    return 'applied';
  elsif p_event_type = 'payment.failed'
    and puja.transition_allowed(booking.status, 'cancelled', 'payment_webhook')
  then
    update puja.bookings set status = 'cancelled', updated_at = now() where id = booking.id;
    perform puja.enqueue_notice(booking.id, 'cancelled', now());
  elsif p_event_type = 'refund.processed'
    and puja.transition_allowed(booking.status, 'refunded', 'payment_webhook')
  then
    update puja.bookings set status = 'refunded', updated_at = now() where id = booking.id;
    perform puja.audit(null, 'payment_webhook', 'refunded', booking.id, null, '{}'::jsonb);
  else
    insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
    values (p_provider, p_event_id, p_event_type, booking.id, p_amount_paise, p_currency, 'rejected');
    return 'rejected';
  end if;

  insert into puja.payment_events (provider, event_id, event_type, booking_id, amount_paise, currency, result)
  values (p_provider, p_event_id, p_event_type, booking.id, p_amount_paise, p_currency, 'applied');
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return 'duplicate';
  end if;
  return 'applied';
end;
$$;

create or replace function puja.customer_cancel(p_booking_id uuid)
returns text
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  paid boolean;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  select * into booking from puja.bookings where id = p_booking_id and customer_id = actor for update;
  if not found or not puja.transition_allowed(booking.status, 'cancelled', 'customer') then
    raise exception 'invalid transition';
  end if;
  update puja.bookings
  set status = 'cancelled', assigned_priest_id = null, updated_at = now()
  where id = booking.id;
  perform puja.audit(actor, 'customer', 'cancel', booking.id, null, '{}'::jsonb);
  perform puja.enqueue_notice(booking.id, 'cancelled', now());
  select exists (
    select 1 from puja.payment_events
    where booking_id = booking.id and event_type = 'payment.captured' and result in ('applied', 'unassigned')
  ) into paid;
  if paid and puja.transition_allowed('cancelled', 'refund_pending', 'system') then
    update puja.bookings set status = 'refund_pending', updated_at = now() where id = booking.id;
    perform puja.audit(actor, 'system', 'refund_pending', booking.id, null, '{}'::jsonb);
    return 'refund_pending';
  end if;
  return 'cancelled';
end;
$$;

create or replace function puja.request_reschedule(
  p_booking_id uuid,
  p_starts_at timestamptz,
  p_time_zone text
)
returns text
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  service puja.services;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  select * into booking from puja.bookings where id = p_booking_id and customer_id = actor for update;
  if not found or not puja.transition_allowed(booking.status, 'rescheduled', 'customer') then
    raise exception 'invalid transition';
  end if;
  select * into service from puja.services where id = booking.service_id;
  if not exists (select 1 from pg_timezone_names where name = p_time_zone) then
    raise exception 'invalid timezone';
  end if;
  if p_starts_at < now() + make_interval(hours => service.min_advance_hours) then
    raise exception 'advance booking required';
  end if;
  update puja.bookings
  set
    status = 'rescheduled',
    starts_at = p_starts_at,
    ends_at = p_starts_at + make_interval(mins => service.duration_minutes),
    time_zone = p_time_zone,
    assigned_priest_id = null,
    preferred_unavailable = false,
    updated_at = now()
  where id = booking.id;
  perform puja.audit(actor, 'customer', 'reschedule', booking.id, null, '{}'::jsonb);
  perform puja.enqueue_notice(booking.id, 'rescheduled', now());
  perform puja.assign_booking(booking.id);
  return 'confirmed';
end;
$$;

create or replace function puja.my_bookings()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select coalesce(jsonb_agg(row_to_json(rows)::jsonb order by rows."startsAt"), '[]'::jsonb)
  from (
    select
      booking.id as "bookingId",
      booking.service_id as "serviceId",
      service.title,
      booking.status,
      booking.starts_at as "startsAt",
      booking.ends_at as "endsAt",
      booking.time_zone as "timeZone",
      booking.language,
      booking.price_paise as "pricePaise",
      booking.currency,
      booking.preferred_unavailable as "preferredUnavailable",
      case when booking.assigned_priest_id is null then null else priest.display_name end as "assignedPriestName"
    from puja.bookings booking
    join puja.services service on service.id = booking.service_id
    left join puja.priests priest on priest.id = booking.assigned_priest_id
    where booking.customer_id = auth.uid()
  ) rows;
$$;

create or replace function puja.save_preferred_priest(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  priest puja.priests;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  select * into booking
  from puja.bookings
  where id = p_booking_id and customer_id = actor;
  if not found or booking.status <> 'completed' or booking.assigned_priest_id is null then
    raise exception 'not completed';
  end if;
  select * into priest from puja.priests where id = booking.assigned_priest_id;
  if priest.verification_status <> 'vetted' or priest.operational_status = 'suspended' then
    raise exception 'priest unavailable';
  end if;
  insert into puja.preferred_priests (customer_id, priest_id, source_booking_id)
  values (actor, priest.id, booking.id)
  on conflict (customer_id) do update
  set priest_id = excluded.priest_id,
      source_booking_id = excluded.source_booking_id,
      saved_at = now();
  perform puja.audit(actor, 'customer', 'save_preferred_priest', booking.id, priest.id, '{}'::jsonb);
end;
$$;

create or replace function puja.submit_review(
  p_booking_id uuid,
  p_rating integer,
  p_feedback text,
  p_issues text[]
)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  existing puja.reviews;
  issue text;
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'invalid rating';
  end if;
  foreach issue in array coalesce(p_issues, '{}') loop
    if issue not in ('late_start', 'audio', 'video', 'ritual_concern', 'conduct', 'other') then
      raise exception 'invalid issue';
    end if;
  end loop;
  select * into booking from puja.bookings where id = p_booking_id and customer_id = actor;
  if not found or booking.status <> 'completed' or booking.assigned_priest_id is null then
    raise exception 'not completed';
  end if;
  select * into existing from puja.reviews where booking_id = booking.id;
  if found then
    if existing.hidden or existing.edit_count >= 1 then
      raise exception 'edit closed';
    end if;
    update puja.reviews
    set rating = p_rating,
        feedback = nullif(btrim(coalesce(p_feedback, '')), ''),
        issue_categories = coalesce(p_issues, '{}'),
        edit_count = edit_count + 1,
        updated_at = now()
    where id = existing.id;
  else
    insert into puja.reviews (booking_id, customer_id, priest_id, rating, feedback, issue_categories)
    values (
      booking.id,
      actor,
      booking.assigned_priest_id,
      p_rating,
      nullif(btrim(coalesce(p_feedback, '')), ''),
      coalesce(p_issues, '{}')
    );
  end if;
end;
$$;

create or replace function puja.add_family_participant(p_booking_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  participants integer;
begin
  if actor is null or p_user_id is null or p_user_id = actor then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from puja.bookings
    where id = p_booking_id and customer_id = actor and status in ('confirmed', 'rescheduled', 'pending_payment', 'pending_assignment')
  ) then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'forbidden';
  end if;
  select count(*) into participants from puja.session_participants where booking_id = p_booking_id;
  if participants >= 6 then
    raise exception 'forbidden';
  end if;
  insert into puja.session_participants (booking_id, user_id)
  values (p_booking_id, p_user_id)
  on conflict do nothing;
  perform puja.audit(actor, 'customer', 'add_family_participant', p_booking_id, null, '{}'::jsonb);
end;
$$;

create or replace function puja.authorize_live_session(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  role text;
  priest_user uuid;
  closes timestamptz;
begin
  if actor is null then
    raise exception 'unauthorized';
  end if;
  select * into booking from puja.bookings where id = p_booking_id;
  if not found then
    raise exception 'unauthorized';
  end if;
  select user_id into priest_user from puja.priests where id = booking.assigned_priest_id;
  if booking.customer_id = actor then
    role := 'customer';
  elsif priest_user = actor then
    role := 'priest';
  elsif exists (
    select 1 from puja.session_participants
    where booking_id = booking.id and user_id = actor
  ) then
    role := 'family';
  else
    raise exception 'unauthorized';
  end if;
  if booking.status not in ('confirmed', 'rescheduled', 'in_progress') then
    raise exception 'not open';
  end if;
  if now() < booking.starts_at - interval '15 minutes' then
    raise exception 'not open';
  end if;
  closes := booking.ends_at + interval '30 minutes';
  if now() > closes then
    raise exception 'ended';
  end if;
  return jsonb_build_object(
    'bookingId', booking.id,
    'room', 'puja_' || booking.id::text,
    'identity', actor,
    'role', role,
    'expiresAt', least(now() + interval '2 hours', closes),
    'recording', false,
    'microphoneMuted', role <> 'priest'
  );
end;
$$;

create or replace function puja.recording_allowed(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = puja, public
as $$
  select coalesce((
    select session.recording_requested
      and not exists (
        select 1
        from (
          select booking.customer_id as user_id
          from puja.bookings booking
          where booking.id = p_booking_id and booking.customer_id is not null
          union
          select priest.user_id
          from puja.bookings booking
          join puja.priests priest on priest.id = booking.assigned_priest_id
          where booking.id = p_booking_id and priest.user_id is not null
          union
          select participant.user_id
          from puja.session_participants participant
          where participant.booking_id = p_booking_id
        ) required
        where not exists (
          select 1 from puja.recording_consents consent
          where consent.booking_id = p_booking_id and consent.user_id = required.user_id
        )
      )
    from puja.sessions session
    where session.booking_id = p_booking_id
  ), false);
$$;

create or replace function puja.priest_transition(p_booking_id uuid, p_to text)
returns text
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
begin
  if actor is null then
    raise exception 'forbidden';
  end if;
  select * into booking from puja.bookings where id = p_booking_id for update;
  if not found or not exists (
    select 1 from puja.priests priest
    where priest.id = booking.assigned_priest_id and priest.user_id = actor
  ) then
    raise exception 'forbidden';
  end if;
  if not puja.transition_allowed(booking.status, p_to, 'priest') then
    raise exception 'invalid transition';
  end if;
  update puja.bookings set status = p_to, updated_at = now() where id = booking.id;
  perform puja.audit(actor, 'priest', p_to, booking.id, booking.assigned_priest_id, '{}'::jsonb);
  if p_to = 'completed' then
    perform puja.enqueue_notice(booking.id, 'completed_review_request', now());
  end if;
  return p_to;
end;
$$;

create or replace function puja.my_assignments()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select coalesce(jsonb_agg(row_to_json(rows)::jsonb order by rows."startsAt"), '[]'::jsonb)
  from (
    select
      booking.id as "bookingId",
      service.title,
      booking.status,
      booking.starts_at as "startsAt",
      booking.ends_at as "endsAt",
      booking.time_zone as "timeZone",
      booking.language,
      family.household_name as "householdName"
    from puja.bookings booking
    join puja.services service on service.id = booking.service_id
    join puja.priests priest on priest.id = booking.assigned_priest_id
    left join puja.family_details family on family.booking_id = booking.id
    where priest.user_id = auth.uid()
      and booking.status in ('confirmed', 'rescheduled', 'in_progress', 'completed')
  ) rows;
$$;

create or replace function puja.family_for_assignment(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  details puja.family_details;
begin
  if actor is null or not exists (
    select 1
    from puja.bookings booking
    join puja.priests priest on priest.id = booking.assigned_priest_id
    where booking.id = p_booking_id
      and priest.user_id = actor
      and booking.status in ('confirmed', 'rescheduled', 'in_progress')
  ) then
    raise exception 'forbidden';
  end if;
  select * into details from puja.family_details where booking_id = p_booking_id;
  return jsonb_build_object(
    'householdName', details.household_name,
    'gotra', details.gotra,
    'sankalpName', details.sankalp_name,
    'nakshatra', details.nakshatra
  );
end;
$$;

create or replace function puja.admin_upsert_service(
  p_id uuid,
  p_slug text,
  p_status text,
  p_title text,
  p_description text,
  p_preparation text,
  p_price_paise integer,
  p_duration_minutes integer,
  p_languages text[],
  p_min_advance_hours integer,
  p_required_family_fields text[]
)
returns uuid
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
begin
  if not puja.is_admin(actor) then
    raise exception 'forbidden';
  end if;
  if p_slug = 'havan-homa' and p_min_advance_hours < 48 then
    raise exception 'havan requires at least 48 hours';
  end if;
  insert into puja.services (
    id, slug, status, title, description, preparation, price_paise, currency,
    duration_minutes, languages, min_advance_hours, required_family_fields
  )
  values (
    p_id, p_slug, p_status, p_title, p_description, p_preparation, p_price_paise, 'INR',
    p_duration_minutes, p_languages, p_min_advance_hours, p_required_family_fields
  )
  on conflict (id) do update set
    slug = excluded.slug,
    status = excluded.status,
    title = excluded.title,
    description = excluded.description,
    preparation = excluded.preparation,
    price_paise = excluded.price_paise,
    duration_minutes = excluded.duration_minutes,
    languages = excluded.languages,
    min_advance_hours = excluded.min_advance_hours,
    required_family_fields = excluded.required_family_fields;
  perform puja.audit(actor, 'admin', 'upsert_service', null, null, jsonb_build_object('slug', p_slug));
  return p_id;
end;
$$;

create or replace function puja.admin_upsert_priest(
  p_id uuid,
  p_user_id uuid,
  p_display_name text,
  p_verification_status text,
  p_operational_status text,
  p_languages text[],
  p_service_ids uuid[],
  p_contact_email text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  service_id uuid;
begin
  if not puja.is_admin(actor) then
    raise exception 'forbidden';
  end if;
  if p_verification_status not in ('pending', 'vetted', 'suspended', 'retired')
    or p_operational_status not in ('active', 'inactive', 'suspended')
  then
    raise exception 'rejected';
  end if;
  insert into puja.priests (
    id, user_id, display_name, verification_status, operational_status, languages, contact_email, contact_phone
  )
  values (
    p_id, p_user_id, p_display_name, p_verification_status, p_operational_status,
    p_languages, p_contact_email, p_contact_phone
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    display_name = excluded.display_name,
    verification_status = excluded.verification_status,
    operational_status = excluded.operational_status,
    languages = excluded.languages,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone;
  delete from puja.priest_services where priest_id = p_id;
  foreach service_id in array coalesce(p_service_ids, '{}') loop
    insert into puja.priest_services (priest_id, service_id) values (p_id, service_id);
  end loop;
  insert into puja.actors (user_id, kind, priest_id, active)
  values (p_user_id, 'priest', p_id, p_operational_status = 'active')
  on conflict (user_id) do update
  set kind = 'priest', priest_id = excluded.priest_id, active = excluded.active;
  perform puja.audit(actor, 'admin', 'upsert_priest', null, p_id, '{}'::jsonb);
  return p_id;
end;
$$;

create or replace function puja.admin_set_availability(
  p_priest_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  new_id uuid := gen_random_uuid();
begin
  if not puja.is_admin(actor) then
    raise exception 'forbidden';
  end if;
  insert into puja.priest_availability (id, priest_id, starts_at, ends_at)
  values (new_id, p_priest_id, p_starts_at, p_ends_at);
  perform puja.audit(actor, 'admin', 'set_availability', null, p_priest_id, '{}'::jsonb);
  return new_id;
end;
$$;

create or replace function puja.admin_reassign(p_booking_id uuid, p_priest_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
  booking puja.bookings;
  previous uuid;
begin
  if not puja.is_admin(actor) or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'forbidden';
  end if;
  select * into booking from puja.bookings where id = p_booking_id for update;
  if not found or booking.status not in ('confirmed', 'rescheduled', 'pending_assignment') then
    raise exception 'invalid transition';
  end if;
  if not puja.priest_is_eligible(
    p_priest_id, booking.service_id, booking.language, booking.starts_at, booking.ends_at, booking.id
  ) then
    raise exception 'no priest available';
  end if;
  previous := booking.assigned_priest_id;
  update puja.bookings
  set
    assigned_priest_id = p_priest_id,
    status = 'confirmed',
    preferred_unavailable = (
      booking.preferred_priest_id is not null and p_priest_id is distinct from booking.preferred_priest_id
    ),
    updated_at = now()
  where id = booking.id;
  perform puja.audit(
    actor,
    'admin',
    'reassign',
    booking.id,
    p_priest_id,
    jsonb_build_object('from', previous, 'reason', p_reason)
  );
end;
$$;

create or replace function puja.admin_suspend_priest(p_priest_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
begin
  if not puja.is_admin(actor) or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'forbidden';
  end if;
  update puja.priests
  set operational_status = 'suspended'
  where id = p_priest_id;
  if not found then
    raise exception 'forbidden';
  end if;
  update puja.actors set active = false where priest_id = p_priest_id;
  perform puja.audit(actor, 'admin', 'suspend_priest', null, p_priest_id, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function puja.admin_flag_review(p_review_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = puja, public
as $$
declare
  actor uuid := auth.uid();
begin
  if not puja.is_admin(actor) or length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'forbidden';
  end if;
  update puja.reviews set hidden = true, updated_at = now() where id = p_review_id;
  if not found then
    raise exception 'forbidden';
  end if;
  perform puja.audit(actor, 'admin', 'flag_review', null, null, jsonb_build_object('review', p_review_id, 'reason', p_reason));
end;
$$;

create or replace function puja.admin_complaints()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select case when not puja.is_admin(auth.uid()) then '[]'::jsonb else coalesce(jsonb_agg(row_to_json(rows)::jsonb), '[]'::jsonb) end
  from (
    select
      review.id as "reviewId",
      review.booking_id as "bookingId",
      review.rating,
      review.feedback,
      review.issue_categories as "issues",
      review.hidden,
      priest.display_name as "priestName"
    from puja.reviews review
    join puja.priests priest on priest.id = review.priest_id
    where cardinality(review.issue_categories) > 0 or review.hidden
  ) rows;
$$;

create or replace function puja.admin_ratings()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select case when not puja.is_admin(auth.uid()) then '[]'::jsonb else coalesce(jsonb_agg(row_to_json(rows)::jsonb), '[]'::jsonb) end
  from (
    select
      priest.id as "priestId",
      priest.display_name as "displayName",
      count(review.id) as "reviewCount",
      round(avg(review.rating)::numeric, 2) as "averageRating"
    from puja.priests priest
    left join puja.reviews review on review.priest_id = priest.id and not review.hidden
    group by priest.id, priest.display_name
  ) rows;
$$;

create or replace function puja.whoami()
returns text
language sql
stable
security definer
set search_path = puja, public
as $$
  select case
    when auth.uid() is null then 'anonymous'
    when exists (select 1 from puja.actors where user_id = auth.uid() and kind = 'admin' and active) then 'admin'
    when exists (select 1 from puja.actors where user_id = auth.uid() and kind = 'priest' and active) then 'priest'
    else 'customer'
  end;
$$;

insert into puja.services (
  id, slug, status, title, description, preparation, price_paise, currency,
  duration_minutes, languages, min_advance_hours, required_family_fields
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'havan-homa',
    'published',
    'Havan / Homa',
    'A private fire ritual for one household, conducted live by an assigned priest.',
    'Keep a clean space and the materials confirmed after booking. The app does not list ritual steps.',
    510000,
    'INR',
    90,
    array['hi', 'en', 'sa'],
    48,
    array['householdName']
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'satyanarayan-katha',
    'published',
    'Satyanarayan Katha',
    'A private Satyanarayan katha for one household.',
    'Keep a quiet place for the household. Preparation details come from the assigned priest after confirmation.',
    310000,
    'INR',
    120,
    array['hi', 'en'],
    24,
    array['householdName']
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'ganesh-puja',
    'published',
    'Ganesh Puja',
    'A private Ganesh puja for one household.',
    'The household joins from one connection. No public or shared session is created.',
    210000,
    'INR',
    60,
    array['hi', 'en', 'mr'],
    12,
    array['householdName']
  );

create view public.live_puja_services
with (security_barrier = true, security_invoker = false) as
select
  id,
  slug,
  title,
  description,
  preparation,
  price_paise,
  currency,
  duration_minutes,
  languages,
  min_advance_hours,
  required_family_fields
from puja.services
where status = 'published';

create or replace function public.puja_create_booking(
  service_id uuid,
  starts_at timestamptz,
  time_zone text,
  language text,
  family jsonb
)
returns jsonb
language sql
security definer
set search_path = puja, public
as $$
  select puja.create_booking(service_id, starts_at, time_zone, language, family);
$$;

create or replace function public.puja_apply_payment_event(
  webhook_secret text,
  provider text,
  event_id text,
  event_type text,
  booking_id uuid,
  amount_paise integer,
  currency text
)
returns text
language sql
security definer
set search_path = puja, public
as $$
  select puja.apply_payment_event(webhook_secret, provider, event_id, event_type, booking_id, amount_paise, currency);
$$;

create or replace function public.puja_cancel_booking(booking_id uuid)
returns text
language sql
security definer
set search_path = puja, public
as $$
  select puja.customer_cancel(booking_id);
$$;

create or replace function public.puja_reschedule_booking(
  booking_id uuid,
  starts_at timestamptz,
  time_zone text
)
returns text
language sql
security definer
set search_path = puja, public
as $$
  select puja.request_reschedule(booking_id, starts_at, time_zone);
$$;

create or replace function public.puja_my_bookings()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.my_bookings();
$$;

create or replace function public.puja_save_preferred_priest(booking_id uuid)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.save_preferred_priest(booking_id);
$$;

create or replace function public.puja_submit_review(
  booking_id uuid,
  rating integer,
  feedback text,
  issues text[]
)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.submit_review(booking_id, rating, feedback, issues);
$$;

create or replace function public.puja_add_family_participant(booking_id uuid, participant_id uuid)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.add_family_participant(booking_id, participant_id);
$$;

create or replace function public.puja_authorize_session(booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.authorize_live_session(booking_id);
$$;

create or replace function public.puja_priest_transition(booking_id uuid, next_status text)
returns text
language sql
security definer
set search_path = puja, public
as $$
  select puja.priest_transition(booking_id, next_status);
$$;

create or replace function public.puja_my_assignments()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.my_assignments();
$$;

create or replace function public.puja_family_for_assignment(booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.family_for_assignment(booking_id);
$$;

create or replace function public.puja_admin_upsert_service(
  id uuid,
  slug text,
  status text,
  title text,
  description text,
  preparation text,
  price_paise integer,
  duration_minutes integer,
  languages text[],
  min_advance_hours integer,
  required_family_fields text[]
)
returns uuid
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_upsert_service(
    id, slug, status, title, description, preparation, price_paise,
    duration_minutes, languages, min_advance_hours, required_family_fields
  );
$$;

create or replace function public.puja_admin_upsert_priest(
  id uuid,
  user_id uuid,
  display_name text,
  verification_status text,
  operational_status text,
  languages text[],
  service_ids uuid[],
  contact_email text,
  contact_phone text
)
returns uuid
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_upsert_priest(
    id, user_id, display_name, verification_status, operational_status,
    languages, service_ids, contact_email, contact_phone
  );
$$;

create or replace function public.puja_admin_set_availability(
  priest_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
returns uuid
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_set_availability(priest_id, starts_at, ends_at);
$$;

create or replace function public.puja_admin_reassign(booking_id uuid, priest_id uuid, reason text)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_reassign(booking_id, priest_id, reason);
$$;

create or replace function public.puja_admin_suspend_priest(priest_id uuid, reason text)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_suspend_priest(priest_id, reason);
$$;

create or replace function public.puja_admin_flag_review(review_id uuid, reason text)
returns void
language sql
security definer
set search_path = puja, public
as $$
  select puja.admin_flag_review(review_id, reason);
$$;

create or replace function public.puja_admin_complaints()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.admin_complaints();
$$;

create or replace function public.puja_admin_ratings()
returns jsonb
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.admin_ratings();
$$;

create or replace function public.puja_whoami()
returns text
language sql
stable
security definer
set search_path = puja, public
as $$
  select puja.whoami();
$$;

revoke all on schema puja from public, anon, authenticated, service_role;
grant usage on schema puja to authenticated, service_role;

revoke all on all tables in schema puja from public, anon, authenticated, service_role;
revoke all on function puja.is_admin(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.audit(uuid, text, text, uuid, uuid, jsonb) from public, anon, authenticated, service_role;
revoke all on function puja.enqueue_notice(uuid, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function puja.transition_allowed(text, text, text) from public, anon, authenticated, service_role;
revoke all on function puja.priest_is_eligible(uuid, uuid, text, timestamptz, timestamptz, uuid) from public, anon, authenticated, service_role;
revoke all on function puja.assign_booking(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.field_present(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function puja.create_booking(uuid, timestamptz, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function puja.apply_payment_event(text, text, text, text, uuid, integer, text) from public, anon, authenticated, service_role;
revoke all on function puja.customer_cancel(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.request_reschedule(uuid, timestamptz, text) from public, anon, authenticated, service_role;
revoke all on function puja.my_bookings() from public, anon, authenticated, service_role;
revoke all on function puja.save_preferred_priest(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.submit_review(uuid, integer, text, text[]) from public, anon, authenticated, service_role;
revoke all on function puja.add_family_participant(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function puja.authorize_live_session(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.recording_allowed(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.priest_transition(uuid, text) from public, anon, authenticated, service_role;
revoke all on function puja.my_assignments() from public, anon, authenticated, service_role;
revoke all on function puja.family_for_assignment(uuid) from public, anon, authenticated, service_role;
revoke all on function puja.admin_upsert_service(uuid, text, text, text, text, text, integer, integer, text[], integer, text[]) from public, anon, authenticated, service_role;
revoke all on function puja.admin_upsert_priest(uuid, uuid, text, text, text, text[], uuid[], text, text) from public, anon, authenticated, service_role;
revoke all on function puja.admin_set_availability(uuid, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function puja.admin_reassign(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function puja.admin_suspend_priest(uuid, text) from public, anon, authenticated, service_role;
revoke all on function puja.admin_flag_review(uuid, text) from public, anon, authenticated, service_role;
revoke all on function puja.admin_complaints() from public, anon, authenticated, service_role;
revoke all on function puja.admin_ratings() from public, anon, authenticated, service_role;
revoke all on function puja.whoami() from public, anon, authenticated, service_role;

revoke all on function public.puja_create_booking(uuid, timestamptz, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.puja_apply_payment_event(text, text, text, text, uuid, integer, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_cancel_booking(uuid) from public, anon, authenticated, service_role;
revoke all on function public.puja_reschedule_booking(uuid, timestamptz, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_my_bookings() from public, anon, authenticated, service_role;
revoke all on function public.puja_save_preferred_priest(uuid) from public, anon, authenticated, service_role;
revoke all on function public.puja_submit_review(uuid, integer, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.puja_add_family_participant(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.puja_authorize_session(uuid) from public, anon, authenticated, service_role;
revoke all on function public.puja_priest_transition(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_my_assignments() from public, anon, authenticated, service_role;
revoke all on function public.puja_family_for_assignment(uuid) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_upsert_service(uuid, text, text, text, text, text, integer, integer, text[], integer, text[]) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_upsert_priest(uuid, uuid, text, text, text, text[], uuid[], text, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_set_availability(uuid, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_reassign(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_suspend_priest(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_flag_review(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_complaints() from public, anon, authenticated, service_role;
revoke all on function public.puja_admin_ratings() from public, anon, authenticated, service_role;
revoke all on function public.puja_whoami() from public, anon, authenticated, service_role;

grant execute on function public.puja_create_booking(uuid, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.puja_cancel_booking(uuid) to authenticated;
grant execute on function public.puja_reschedule_booking(uuid, timestamptz, text) to authenticated;
grant execute on function public.puja_my_bookings() to authenticated;
grant execute on function public.puja_save_preferred_priest(uuid) to authenticated;
grant execute on function public.puja_submit_review(uuid, integer, text, text[]) to authenticated;
grant execute on function public.puja_add_family_participant(uuid, uuid) to authenticated;
grant execute on function public.puja_authorize_session(uuid) to authenticated;
grant execute on function public.puja_priest_transition(uuid, text) to authenticated;
grant execute on function public.puja_my_assignments() to authenticated;
grant execute on function public.puja_family_for_assignment(uuid) to authenticated;
grant execute on function public.puja_admin_upsert_service(uuid, text, text, text, text, text, integer, integer, text[], integer, text[]) to authenticated;
grant execute on function public.puja_admin_upsert_priest(uuid, uuid, text, text, text, text[], uuid[], text, text) to authenticated;
grant execute on function public.puja_admin_set_availability(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.puja_admin_reassign(uuid, uuid, text) to authenticated;
grant execute on function public.puja_admin_suspend_priest(uuid, text) to authenticated;
grant execute on function public.puja_admin_flag_review(uuid, text) to authenticated;
grant execute on function public.puja_admin_complaints() to authenticated;
grant execute on function public.puja_admin_ratings() to authenticated;
grant execute on function public.puja_whoami() to anon, authenticated;
grant execute on function public.puja_apply_payment_event(text, text, text, text, uuid, integer, text) to service_role;

revoke all on table public.live_puja_services from public, service_role;
grant select on table public.live_puja_services to anon, authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, puja
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  delete from puja.family_details
  where booking_id in (select id from puja.bookings where customer_id = actor);
  delete from puja.session_participants where user_id = actor;
  delete from puja.recording_consents where user_id = actor;
  delete from puja.preferred_priests where customer_id = actor;
  update puja.reviews
  set customer_id = null, feedback = null, issue_categories = '{}'
  where customer_id = actor;
  update puja.bookings
  set customer_id = null, anonymized_at = now()
  where customer_id = actor;
  update puja.priests
  set user_id = null, operational_status = 'inactive'
  where user_id = actor;
  delete from puja.actors where user_id = actor;
  delete from public.private_preferences where user_id = actor;
  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.delete_own_account() from public, anon, service_role;
grant execute on function public.delete_own_account() to authenticated;
