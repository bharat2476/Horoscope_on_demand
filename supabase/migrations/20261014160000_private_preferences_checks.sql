-- A modified client can still call the anon key. These checks keep a preference
-- row inside the fields the app understands. They do not add birth or location columns.

alter table public.private_preferences
  add constraint private_preferences_locale_check
    check (locale in ('system', 'en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa')),
  add constraint private_preferences_rashi_check
    check (
      rashi_id is null
      or rashi_id in (
        'mesha', 'vrishabha', 'mithuna', 'karka', 'simha', 'kanya',
        'tula', 'vrishchika', 'dhanu', 'makara', 'kumbha', 'meena'
      )
    ),
  add constraint private_preferences_city_check
    check (city_id is null or city_id ~ '^[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint private_preferences_tradition_check
    check (
      tradition_id is null
      or tradition_id in ('smarta', 'vaishnava', 'shaiva', 'shakta')
    ),
  add constraint private_preferences_notifications_shape_check
    check (
      jsonb_typeof(notifications) = 'object'
      and notifications ->> 'delivery' = 'off'
      and jsonb_typeof(notifications -> 'festivals') = 'boolean'
      and jsonb_typeof(notifications -> 'rituals') = 'boolean'
    );

create or replace function public.private_preferences_reject_extra_notification_keys()
returns trigger
language plpgsql
as $$
declare
  key_count integer;
begin
  select count(*) into key_count from jsonb_object_keys(new.notifications);
  if key_count <> 3 then
    raise exception 'invalid notifications';
  end if;
  return new;
end;
$$;

create trigger private_preferences_notification_keys
before insert or update on public.private_preferences
for each row
execute function public.private_preferences_reject_extra_notification_keys();

revoke all on function public.private_preferences_reject_extra_notification_keys()
from public, anon, authenticated, service_role;

revoke all on table public.private_preferences from service_role;
revoke all on function public.delete_own_account() from service_role;
