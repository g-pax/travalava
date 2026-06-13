-- Brute-force protection for trip PINs: rate-limit join attempts per user+trip.
-- join_trip is SECURITY DEFINER, so it logs every attempt and rejects once a
-- user has accumulated too many failures in a short window.

create table public.join_attempts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  succeeded boolean not null,
  created_at timestamptz not null default now()
);

create index join_attempts_user_trip_idx
  on public.join_attempts (user_id, trip_id, created_at desc);

alter table public.join_attempts enable row level security;
-- No policies: only the SECURITY DEFINER join_trip function (owner) touches it.

-- Replace join_trip with a rate-limited version. Behavior is otherwise
-- unchanged: idempotent re-join, server-side PIN verify.
create or replace function public.join_trip(
  p_trip_id uuid,
  p_pin text default null,
  p_display_name text default null
)
returns public.trip_members
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_trip public.trips;
  v_member public.trip_members;
  v_recent_fails integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_trip from public.trips where id = p_trip_id;
  if not found then
    raise exception 'TRIP_NOT_FOUND';
  end if;

  -- Already a member? Idempotent success, no attempt logged.
  select * into v_member from public.trip_members
  where trip_id = p_trip_id and user_id = v_uid;
  if found then
    return v_member;
  end if;

  -- Rate limit: max 5 failed attempts per user+trip in 15 minutes.
  select count(*) into v_recent_fails
  from public.join_attempts
  where user_id = v_uid
    and trip_id = p_trip_id
    and not succeeded
    and created_at > now() - interval '15 minutes';
  if v_recent_fails >= 5 then
    raise exception 'TOO_MANY_ATTEMPTS';
  end if;

  -- Verify PIN when the trip requires one.
  if v_trip.pin_hash is not null then
    if p_pin is null or extensions.crypt(p_pin, v_trip.pin_hash) <> v_trip.pin_hash then
      insert into public.join_attempts (trip_id, user_id, succeeded)
      values (p_trip_id, v_uid, false);
      raise exception 'INVALID_PIN';
    end if;
  end if;

  insert into public.trip_members (trip_id, role, display_name, user_id)
  values (
    p_trip_id, 'collaborator',
    coalesce(
      nullif(p_display_name, ''),
      (select split_part(email, '@', 1) from auth.users where id = v_uid),
      'Friend'
    ),
    v_uid
  )
  returning * into v_member;

  insert into public.join_attempts (trip_id, user_id, succeeded)
  values (p_trip_id, v_uid, true);

  return v_member;
end;
$$;

revoke execute on function public.join_trip(uuid, text, text) from public, anon;
grant execute on function public.join_trip(uuid, text, text) to authenticated;
