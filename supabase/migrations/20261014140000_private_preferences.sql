-- Private preference rows belong to one signed-in user.
-- Anonymous clients can still read the published content views from the earlier migration.
-- The service-role key is not granted to the mobile app.

create table public.private_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locale text not null,
  rashi_id text,
  city_id text,
  tradition_id text,
  notifications jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.private_preferences enable row level security;

create policy private_preferences_select
on public.private_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy private_preferences_insert
on public.private_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy private_preferences_update
on public.private_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy private_preferences_delete
on public.private_preferences
for delete
to authenticated
using (user_id = auth.uid());

revoke all on public.private_preferences from public, anon;
grant select, insert, update, delete on public.private_preferences to authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  delete from public.private_preferences where user_id = actor;
  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
