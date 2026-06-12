-- Privilege-escalation guard for trip_members updates.
-- The update policy allows self-updates (for display_name), but its
-- WITH CHECK alone can't compare OLD vs NEW — without this guard a
-- collaborator could update their own row to role='organizer'.
-- A BEFORE UPDATE trigger sees both rows: identity fields are immutable,
-- and role changes require organizer privilege.

create or replace function public.guard_trip_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.trip_id is distinct from old.trip_id then
    raise exception 'MEMBER_IDENTITY_IMMUTABLE';
  end if;
  if new.role is distinct from old.role
     and not public.is_trip_organizer(old.trip_id) then
    raise exception 'ORGANIZER_REQUIRED';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_trip_member_update() from public, anon, authenticated;

create trigger guard_trip_member_update
  before update on public.trip_members
  for each row execute procedure public.guard_trip_member_update();
