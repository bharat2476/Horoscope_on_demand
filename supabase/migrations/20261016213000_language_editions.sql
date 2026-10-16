-- Per-language review for rituals, festivals, and temples.
-- Additive only. Does not drop, rename, or rewrite existing tables or views.
-- Depends on content.documents from 20261014120000_content_review.sql.
-- Daily readings already store one review status per language in content.daily_readings.
-- The mobile client can select the published edition views. It cannot write.

create table content.language_editions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references content.documents (id) on delete cascade,
  language text not null check (
    language in ('en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa')
  ),
  version integer not null check (version > 0),
  status text not null check (
    status in ('draft', 'in-review', 'approved', 'rejected', 'published', 'retired')
  ),
  title text not null,
  observance text,
  locality text,
  steps text,
  development_example boolean not null default false,
  created_by uuid not null,
  reviewer_id uuid,
  review_date date,
  published_at timestamptz,
  constraint language_edition_published_review check (
    status <> 'published'
    or (
      reviewer_id is not null
      and reviewer_id <> created_by
      and review_date is not null
      and published_at is not null
      and development_example = false
      and length(btrim(title)) > 0
    )
  ),
  unique (document_id, language, version)
);

create unique index one_published_language_edition
  on content.language_editions (document_id, language)
  where status = 'published';

alter table content.language_editions enable row level security;

create trigger language_editions_no_direct_write
before insert or update or delete on content.language_editions
for each row execute function content.block_direct_write();

create or replace function content.edition_text_allowed(
  p_title text,
  p_observance text,
  p_locality text,
  p_steps text
)
returns void
language plpgsql
immutable
as $$
declare
  payload jsonb;
begin
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'title required';
  end if;
  payload := jsonb_build_object(
    'title', p_title,
    'observance', p_observance,
    'locality', p_locality,
    'steps', p_steps
  );
  if payload::text ~* 'birthDate|birthTime|birthPlace|birthplace|birth_date|birth_time|birth_place' then
    raise exception 'birth details are not public content';
  end if;
  perform content.assert_no_forbidden_claim(payload);
end;
$$;

create or replace function content.create_language_edition(
  p_document_id uuid,
  p_language text,
  p_title text,
  p_observance text,
  p_locality text,
  p_steps text,
  p_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid := content.editor_actor();
  parent content.documents;
  next_version integer;
  new_id uuid := gen_random_uuid();
begin
  if not content.has_grant(actor, 'create') then
    raise exception 'missing permission: create';
  end if;
  if p_language not in ('en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa') then
    raise exception 'unknown language';
  end if;
  perform content.edition_text_allowed(p_title, p_observance, p_locality, p_steps);
  select * into parent from content.documents where id = p_document_id;
  if not found or parent.kind not in ('ritual', 'festival', 'temple') then
    raise exception 'document not found';
  end if;
  if exists (
    select 1
    from content.language_editions
    where document_id = p_document_id
      and language = p_language
      and status in ('draft', 'in-review', 'approved')
  ) then
    raise exception 'edition already open';
  end if;
  select coalesce(max(version), 0) + 1 into next_version
  from content.language_editions
  where document_id = p_document_id and language = p_language;
  perform set_config('content.workflow', 'on', true);
  insert into content.language_editions (
    id, document_id, language, version, status, title, observance, locality, steps, created_by
  )
  values (
    new_id, p_document_id, p_language, next_version, 'draft',
    btrim(p_title), nullif(btrim(coalesce(p_observance, '')), ''),
    nullif(btrim(coalesce(p_locality, '')), ''), nullif(btrim(coalesce(p_steps, '')), ''),
    actor
  );
  insert into content.revisions (document_id, revision, actor_id, action, note, at)
  values (
    p_document_id,
    (select coalesce(max(revision), 0) + 1 from content.revisions where document_id = p_document_id),
    actor,
    'create',
    null,
    p_at
  );
  return new_id;
end;
$$;

create or replace function content.apply_language_edition(
  p_edition_id uuid,
  p_action text,
  p_title text,
  p_observance text,
  p_locality text,
  p_steps text,
  p_note text,
  p_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid := content.editor_actor();
  current_row content.language_editions;
  parent content.documents;
  next_status text;
begin
  if p_action not in ('revise', 'submit', 'approve', 'reject', 'publish', 'retire') then
    raise exception 'unknown action';
  end if;
  if not content.has_grant(actor, p_action) then
    raise exception 'missing permission: %', p_action;
  end if;
  select * into current_row
  from content.language_editions
  where id = p_edition_id
  for update;
  if not found then
    raise exception 'edition not found';
  end if;
  select * into parent from content.documents where id = current_row.document_id;
  if not found then
    raise exception 'document not found';
  end if;

  if p_action = 'revise' then
    if current_row.status not in ('draft', 'rejected') then
      raise exception 'invalid transition';
    end if;
    perform content.edition_text_allowed(p_title, p_observance, p_locality, p_steps);
    next_status := 'draft';
  elsif p_action = 'submit' then
    if current_row.status <> 'draft' then
      raise exception 'invalid transition';
    end if;
    next_status := 'in-review';
  elsif p_action = 'approve' then
    if current_row.status <> 'in-review' then
      raise exception 'invalid transition';
    end if;
    if actor = current_row.created_by then
      raise exception 'self-approval';
    end if;
    next_status := 'approved';
  elsif p_action = 'reject' then
    if current_row.status <> 'in-review' or coalesce(p_note, '') = '' then
      raise exception 'rejection note required';
    end if;
    next_status := 'rejected';
  elsif p_action = 'publish' then
    if current_row.status <> 'approved' or current_row.reviewer_id is null then
      raise exception 'approval required';
    end if;
    if current_row.reviewer_id = current_row.created_by then
      raise exception 'self-approval';
    end if;
    if parent.status <> 'published' then
      raise exception 'document approval required';
    end if;
    if current_row.development_example then
      raise exception 'development example cannot be published';
    end if;
    if parent.kind = 'festival' and coalesce(btrim(current_row.observance), '') = '' then
      raise exception 'observance required';
    end if;
    if parent.kind = 'festival'
      and coalesce(parent.body ->> 'calendarDate', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    then
      raise exception 'festival date must be stored';
    end if;
    perform content.edition_text_allowed(
      current_row.title, current_row.observance, current_row.locality, current_row.steps
    );
    next_status := 'published';
  else
    if current_row.status <> 'published' then
      raise exception 'invalid transition';
    end if;
    next_status := 'retired';
  end if;

  perform set_config('content.workflow', 'on', true);
  update content.language_editions
  set
    status = next_status,
    title = case when p_action = 'revise' then btrim(p_title) else title end,
    observance = case
      when p_action = 'revise' then nullif(btrim(coalesce(p_observance, '')), '')
      else observance
    end,
    locality = case
      when p_action = 'revise' then nullif(btrim(coalesce(p_locality, '')), '')
      else locality
    end,
    steps = case
      when p_action = 'revise' then nullif(btrim(coalesce(p_steps, '')), '')
      else steps
    end,
    reviewer_id = case when p_action = 'approve' then actor else reviewer_id end,
    review_date = case when p_action = 'approve' then p_at::date else review_date end,
    published_at = case when p_action = 'publish' then p_at else published_at end
  where id = current_row.id;

  insert into content.revisions (document_id, revision, actor_id, action, note, at)
  values (
    current_row.document_id,
    (select coalesce(max(revision), 0) + 1 from content.revisions where document_id = current_row.document_id),
    actor,
    p_action,
    p_note,
    p_at
  );
  return current_row.id;
end;
$$;

-- Published wording only. Reviewer ids, review dates, and revision notes stay off these views.
-- The parent document must already be published, and this language edition must be published.

create view public.published_ritual_editions
with (security_barrier = true, security_invoker = false) as
select
  d.id,
  e.language,
  d.body ->> 'category' as category,
  e.title,
  e.steps
from content.language_editions e
join content.documents d on d.id = e.document_id
where e.status = 'published'
  and e.development_example = false
  and d.kind = 'ritual'
  and d.status = 'published';

create view public.published_festival_editions
with (security_barrier = true, security_invoker = false) as
select
  d.id,
  e.language,
  e.title as name,
  e.observance,
  d.body ->> 'regionId' as region_id,
  d.body ->> 'calendarDate' as calendar_date,
  d.body ->> 'convention' as convention
from content.language_editions e
join content.documents d on d.id = e.document_id
where e.status = 'published'
  and e.development_example = false
  and d.kind = 'festival'
  and d.status = 'published';

create view public.published_temple_editions
with (security_barrier = true, security_invoker = false) as
select
  d.id,
  e.language,
  e.title as name,
  e.locality,
  d.body ->> 'deity' as deity,
  d.body ->> 'stateId' as state_id,
  d.body ->> 'cityId' as city_id,
  d.body ->> 'lastVerifiedOn' as last_verified_on
from content.language_editions e
join content.documents d on d.id = e.document_id
where e.status = 'published'
  and e.development_example = false
  and d.kind = 'temple'
  and d.status = 'published';

revoke all on content.language_editions from public, anon, authenticated, service_role, content_staff;

revoke all on function content.edition_text_allowed(text, text, text, text)
from public, anon, authenticated, service_role;
revoke all on function content.create_language_edition(uuid, text, text, text, text, text, timestamptz)
from public, anon, authenticated, service_role;
revoke all on function content.apply_language_edition(uuid, text, text, text, text, text, text, timestamptz)
from public, anon, authenticated, service_role;

grant execute on function content.create_language_edition(uuid, text, text, text, text, text, timestamptz)
to content_staff;
grant execute on function content.apply_language_edition(uuid, text, text, text, text, text, text, timestamptz)
to content_staff;

revoke all on table public.published_ritual_editions,
  public.published_festival_editions,
  public.published_temple_editions
from public, service_role;
grant select on table public.published_ritual_editions,
  public.published_festival_editions,
  public.published_temple_editions
to anon, authenticated;
