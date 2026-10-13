-- Review workflow for rituals, festivals, and temples.
-- The Android client can read the public views of published rows.
-- It cannot insert, update, or publish. Workflow functions run only as content_staff
-- after a trusted server sets content.actor_id from a verified user id.

create schema if not exists content;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'content_staff') then
    create role content_staff nologin;
  end if;
end
$$;

create table content.grants (
  user_id uuid not null references auth.users (id) on delete cascade,
  permission text not null check (
    permission in ('create', 'revise', 'submit', 'approve', 'reject', 'publish', 'retire')
  ),
  granted_at timestamptz not null default now(),
  primary key (user_id, permission)
);

create table content.documents (
  id uuid primary key,
  kind text not null check (kind in ('ritual', 'festival', 'temple')),
  status text not null check (
    status in ('draft', 'in-review', 'approved', 'rejected', 'published', 'retired')
  ),
  created_by uuid not null,
  reviewer_id uuid,
  review_date date,
  published_at timestamptz,
  body jsonb not null,
  constraint published_requires_review check (
    status <> 'published'
    or (reviewer_id is not null and review_date is not null and published_at is not null)
  ),
  constraint body_has_no_status check (not (body ? 'status' or body ? 'review'))
);

create table content.revisions (
  id bigint generated always as identity primary key,
  document_id uuid not null references content.documents (id) on delete cascade,
  revision integer not null check (revision > 0),
  actor_id uuid not null,
  action text not null,
  note text,
  at timestamptz not null
);

create table content.submissions (
  id uuid primary key,
  temple_id uuid not null references content.documents (id) on delete cascade,
  kind text not null check (kind in ('photo', 'correction')),
  status text not null check (status in ('pending', 'rejected', 'accepted')),
  submitted_by uuid not null,
  permission text not null check (permission in ('contributor-granted', 'not-granted')),
  storage_path text,
  note text not null,
  constraint accepted_photo_needs_permission check (
    status <> 'accepted'
    or kind <> 'photo'
    or (permission = 'contributor-granted' and storage_path is not null)
  )
);

alter table content.grants enable row level security;
alter table content.documents enable row level security;
alter table content.revisions enable row level security;
alter table content.submissions enable row level security;

create or replace function content.block_direct_write()
returns trigger
language plpgsql
as $$
begin
  if current_setting('content.workflow', true) is distinct from 'on' then
    raise exception 'direct writes are not allowed';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger documents_no_direct_write
before insert or update or delete on content.documents
for each row execute function content.block_direct_write();

create trigger revisions_no_direct_write
before insert or update or delete on content.revisions
for each row execute function content.block_direct_write();

create trigger submissions_no_direct_write
before insert or update or delete on content.submissions
for each row execute function content.block_direct_write();

create or replace function content.editor_actor()
returns uuid
language plpgsql
stable
security definer
set search_path = content, public
as $$
declare
  raw text;
begin
  raw := current_setting('content.actor_id', true);
  if raw is null or raw = '' then
    raise exception 'editor session required';
  end if;
  return raw::uuid;
end;
$$;

create or replace function content.has_grant(actor uuid, needed text)
returns boolean
language sql
stable
security definer
set search_path = content, public
as $$
  select exists (
    select 1
    from content.grants
    where user_id = actor and permission = needed
  );
$$;

create or replace function content.assert_no_forbidden_claim(body jsonb)
returns void
language plpgsql
immutable
as $$
declare
  haystack text := body::text;
begin
  if haystack ~* 'financial success'
    or haystack ~* 'guarantees protection'
    or haystack ~* 'guarantees health'
    or haystack ~* 'will cure'
    or haystack ~* 'will heal'
    or haystack ~* 'removes all dosha'
  then
    raise exception 'forbidden claim';
  end if;
end;
$$;

create or replace function content.assert_publishable(kind text, body jsonb)
returns void
language plpgsql
immutable
as $$
declare
  source jsonb;
  mantra jsonb;
begin
  perform content.assert_no_forbidden_claim(body);
  if jsonb_typeof(body -> 'sources') <> 'array' or jsonb_array_length(body -> 'sources') = 0 then
    raise exception 'missing source';
  end if;
  for source in select value from jsonb_array_elements(body -> 'sources')
  loop
    if coalesce(source ->> 'citation', '') = '' or coalesce(source ->> 'title', '') = '' then
      raise exception 'missing citation';
    end if;
    if coalesce(source ->> 'reuse', '') not in (
      'public-domain',
      'quoted-with-permission',
      'short-citation-only'
    ) then
      raise exception 'uncleared source';
    end if;
  end loop;
  if kind = 'festival' and coalesce(body ->> 'calendarDate', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'festival date must be stored; this database does not guess one';
  end if;
  if kind = 'festival' and coalesce(body ->> 'convention', '') = '' then
    raise exception 'missing convention';
  end if;
  if kind = 'temple' and coalesce(body ->> 'lastVerifiedOn', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'missing verification date';
  end if;
  if kind = 'ritual' and jsonb_typeof(body -> 'mantras') = 'array' then
    for mantra in select value from jsonb_array_elements(body -> 'mantras')
    loop
      if not exists (
        select 1
        from jsonb_array_elements(body -> 'sources') as candidate (value)
        where candidate.value ->> 'id' = mantra ->> 'sourceId'
          and candidate.value ->> 'reuse' in (
            'public-domain',
            'quoted-with-permission',
            'short-citation-only'
          )
      ) then
        raise exception 'mantra without source';
      end if;
    end loop;
  end if;
end;
$$;

create or replace function content.create_document(kind text, body jsonb, at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid := content.editor_actor();
  new_id uuid := gen_random_uuid();
begin
  if kind not in ('ritual', 'festival', 'temple') then
    raise exception 'unknown content kind';
  end if;
  if not content.has_grant(actor, 'create') then
    raise exception 'missing permission: create';
  end if;
  if body ? 'status' or body ? 'review' then
    raise exception 'status is controlled by the review workflow';
  end if;
  perform content.assert_no_forbidden_claim(body);
  perform set_config('content.workflow', 'on', true);
  insert into content.documents (id, kind, status, created_by, body)
  values (new_id, kind, 'draft', actor, body);
  insert into content.revisions (document_id, revision, actor_id, action, note, at)
  values (new_id, 1, actor, 'create', null, at);
  return new_id;
end;
$$;

create or replace function content.apply_action(
  p_document_id uuid,
  p_action text,
  p_body jsonb,
  p_note text,
  p_at timestamptz
)
returns content.documents
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid := content.editor_actor();
  current_row content.documents;
  next_status text;
begin
  if p_action not in ('revise', 'submit', 'approve', 'reject', 'publish', 'retire') then
    raise exception 'unknown action';
  end if;
  if not content.has_grant(actor, p_action) then
    raise exception 'missing permission: %', p_action;
  end if;
  select * into current_row
  from content.documents
  where id = p_document_id
  for update;
  if not found then
    raise exception 'document not found';
  end if;

  if p_action = 'revise' then
    if current_row.status not in ('draft', 'rejected') then
      raise exception 'invalid transition';
    end if;
    if p_body is null or p_body ? 'status' or p_body ? 'review' then
      raise exception 'status is controlled by the review workflow';
    end if;
    perform content.assert_no_forbidden_claim(p_body);
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
    if not exists (
      select 1
      from content.revisions
      where document_id = current_row.id
        and action = 'approve'
        and actor_id <> current_row.created_by
    ) then
      raise exception 'approval required';
    end if;
    perform content.assert_publishable(current_row.kind, current_row.body);
    next_status := 'published';
  else
    if current_row.status <> 'published' then
      raise exception 'invalid transition';
    end if;
    next_status := 'retired';
  end if;

  perform set_config('content.workflow', 'on', true);
  update content.documents
  set
    status = next_status,
    body = case when p_action = 'revise' then p_body else body end,
    reviewer_id = case when p_action = 'approve' then actor else reviewer_id end,
    review_date = case when p_action = 'approve' then p_at::date else review_date end,
    published_at = case when p_action = 'publish' then p_at else published_at end
  where id = current_row.id
  returning * into current_row;

  insert into content.revisions (document_id, revision, actor_id, action, note, at)
  values (
    current_row.id,
    (select coalesce(max(revision), 0) + 1 from content.revisions where document_id = current_row.id),
    actor,
    p_action,
    p_note,
    p_at
  );
  return current_row;
end;
$$;

create or replace function content.moderate_submission(
  p_temple_id uuid,
  p_submission_id uuid,
  p_decision text,
  p_note text
)
returns content.submissions
language plpgsql
security definer
set search_path = content, public
as $$
declare
  actor uuid := content.editor_actor();
  current_row content.submissions;
  needed text;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'unknown decision';
  end if;
  needed := case when p_decision = 'accepted' then 'approve' else 'reject' end;
  if not content.has_grant(actor, needed) then
    raise exception 'missing permission: %', needed;
  end if;
  select * into current_row
  from content.submissions
  where id = p_submission_id and temple_id = p_temple_id
  for update;
  if not found or current_row.status <> 'pending' then
    raise exception 'missing submission';
  end if;
  if p_decision = 'accepted'
    and current_row.kind = 'photo'
    and current_row.permission <> 'contributor-granted'
  then
    raise exception 'permission not granted';
  end if;
  if p_decision = 'rejected' and coalesce(p_note, '') = '' then
    raise exception 'rejection note required';
  end if;
  perform set_config('content.workflow', 'on', true);
  update content.submissions
  set status = p_decision
  where id = current_row.id
  returning * into current_row;
  return current_row;
end;
$$;

create view public.published_rituals
with (security_barrier = true, security_invoker = false) as
select id, body, reviewer_id, review_date, published_at
from content.documents
where kind = 'ritual' and status = 'published';

create view public.published_festivals
with (security_barrier = true, security_invoker = false) as
select id, body, reviewer_id, review_date, published_at
from content.documents
where kind = 'festival' and status = 'published';

create view public.published_temples
with (security_barrier = true, security_invoker = false) as
select id, body, reviewer_id, review_date, published_at
from content.documents
where kind = 'temple' and status = 'published';

revoke all on schema content from public, anon, authenticated, service_role;
grant usage on schema content to content_staff;

revoke all on content.grants, content.documents, content.revisions, content.submissions
from public, anon, authenticated, service_role, content_staff;

revoke all on function content.block_direct_write() from public, anon, authenticated, service_role;
revoke all on function content.editor_actor() from public, anon, authenticated, service_role;
revoke all on function content.has_grant(uuid, text) from public, anon, authenticated, service_role;
revoke all on function content.assert_no_forbidden_claim(jsonb) from public, anon, authenticated, service_role;
revoke all on function content.assert_publishable(text, jsonb) from public, anon, authenticated, service_role;
revoke all on function content.create_document(text, jsonb, timestamptz) from public, anon, authenticated, service_role;
revoke all on function content.apply_action(uuid, text, jsonb, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function content.moderate_submission(uuid, uuid, text, text) from public, anon, authenticated, service_role;

grant execute on function content.create_document(text, jsonb, timestamptz) to content_staff;
grant execute on function content.apply_action(uuid, text, jsonb, text, timestamptz) to content_staff;
grant execute on function content.moderate_submission(uuid, uuid, text, text) to content_staff;

revoke all on table public.published_rituals, public.published_festivals, public.published_temples
from public, anon, authenticated, service_role;
grant select on table public.published_rituals, public.published_festivals, public.published_temples
to anon, authenticated;
