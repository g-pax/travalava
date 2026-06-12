-- Travalava initial schema
-- Rebuilt from src/types/database.ts, feature code, and docs/specs after the
-- original Supabase project became unrestorable. Includes RLS for every table
-- (trip-scoped), idempotency columns (client_mutation_id), and RPCs for the
-- privileged flows: create_trip, join_trip (server-side PIN check), and
-- swap_block_commits (atomic itinerary swap).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists moddatetime with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination_text text not null,
  lat double precision,
  lon double precision,
  start_date date not null,
  end_date date not null,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  duplicate_policy text not null default 'soft_block'
    check (duplicate_policy in ('soft_block', 'prevent', 'allow')),
  invite_token_version integer not null default 1,
  share_enabled boolean not null default false,
  share_token_version integer not null default 1,
  pin_hash text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  client_mutation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  role text not null check (role in ('organizer', 'collaborator')),
  display_name text not null,
  user_id uuid references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  client_mutation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, date)
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  label text not null,
  position integer not null,
  vote_open_ts timestamptz,
  vote_close_ts timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_id, position)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  category text,
  cost_amount numeric,
  cost_currency text,
  duration_min integer,
  notes text,
  link text,
  src text, -- thumbnail/cover image URL (R2)
  location jsonb,
  client_mutation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.block_proposals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  block_id uuid not null references public.blocks (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  created_by uuid not null references public.trip_members (id) on delete cascade,
  client_mutation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, activity_id)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  block_id uuid not null references public.blocks (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  member_id uuid not null references public.trip_members (id) on delete cascade,
  client_mutation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, activity_id, member_id)
);

create table public.commits (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  block_id uuid not null references public.blocks (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  committed_by uuid not null references public.trip_members (id) on delete cascade,
  committed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- deferrable so swap_block_commits can exchange two rows in one statement
  constraint commits_block_id_key unique (block_id) deferrable initially immediate
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  cuisine_type text,
  price_range text check (price_range in ('$', '$$', '$$$', '$$$$')),
  description text,
  address text,
  phone text,
  website text,
  image_url text,
  rating numeric,
  review_count integer,
  place_id text,
  lat double precision,
  lon double precision,
  location_updated_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_restaurants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  sort_order integer not null default 0,
  linked_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (activity_id, restaurant_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('bug', 'idea', 'other')) not null,
  severity text check (severity in ('S1', 'S2', 'S3', 'S4')) default 'S3',
  message text not null,
  url text,
  route text,
  user_id uuid,
  user_agent text,
  viewport jsonb,
  locale text,
  timezone text,
  app_version text,
  git_sha text,
  env text default 'prod',
  feature_flags jsonb default '{}'::jsonb,
  breadcrumbs jsonb,
  screenshot_path text, -- R2 object key
  ip_hash text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index trip_members_trip_id_idx on public.trip_members (trip_id);
create index trip_members_user_id_idx on public.trip_members (user_id);
create index days_trip_id_idx on public.days (trip_id);
create index blocks_day_id_idx on public.blocks (day_id);
create index activities_trip_id_idx on public.activities (trip_id);
create index block_proposals_trip_id_idx on public.block_proposals (trip_id);
create index block_proposals_block_id_idx on public.block_proposals (block_id);
create index block_proposals_activity_id_idx on public.block_proposals (activity_id);
create index block_proposals_created_by_idx on public.block_proposals (created_by);
create index votes_trip_id_idx on public.votes (trip_id);
create index votes_block_id_idx on public.votes (block_id);
create index votes_activity_id_idx on public.votes (activity_id);
create index votes_member_id_idx on public.votes (member_id);
create index commits_trip_id_idx on public.commits (trip_id);
create index commits_activity_id_idx on public.commits (activity_id);
create index commits_committed_by_idx on public.commits (committed_by);
create index restaurants_trip_id_idx on public.restaurants (trip_id);
create index activity_restaurants_activity_id_idx on public.activity_restaurants (activity_id);
create index activity_restaurants_restaurant_id_idx on public.activity_restaurants (restaurant_id);
create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_route_idx on public.feedback (route);
create index feedback_user_idx on public.feedback (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger handle_updated_at before update on public.user_profiles
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.trips
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.trip_members
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.days
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.blocks
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.activities
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.block_proposals
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.votes
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.commits
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger handle_updated_at before update on public.restaurants
  for each row execute procedure extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- Auto-create user_profiles on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions (security definer: owner bypasses RLS, avoiding
-- recursive policy evaluation on trip_members; all depend on auth.uid())
-- ---------------------------------------------------------------------------

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_trip_organizer(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = (select auth.uid())
      and role = 'organizer'
  );
$$;

create or replace function public.my_member_id(p_trip_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.trip_members
  where trip_id = p_trip_id and user_id = (select auth.uid())
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.days enable row level security;
alter table public.blocks enable row level security;
alter table public.activities enable row level security;
alter table public.block_proposals enable row level security;
alter table public.votes enable row level security;
alter table public.commits enable row level security;
alter table public.restaurants enable row level security;
alter table public.activity_restaurants enable row level security;
alter table public.feedback enable row level security;

-- user_profiles: own row only
create policy "own_profile_select" on public.user_profiles for select
  to authenticated using ((select auth.uid()) = id);
create policy "own_profile_insert" on public.user_profiles for insert
  to authenticated with check ((select auth.uid()) = id);
create policy "own_profile_update" on public.user_profiles for update
  to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- trips: visible to creator (covers select-after-insert before the member row
-- exists) and members; mutations by organizers
create policy "trips_select" on public.trips for select
  to authenticated
  using (created_by = (select auth.uid()) or public.is_trip_member(id));
create policy "trips_insert" on public.trips for insert
  to authenticated with check (created_by = (select auth.uid()));
create policy "trips_update" on public.trips for update
  to authenticated using (public.is_trip_organizer(id))
  with check (public.is_trip_organizer(id));
create policy "trips_delete" on public.trips for delete
  to authenticated using (public.is_trip_organizer(id));

-- trip_members: members see the roster; self-insert only for the trip creator
-- (organizer bootstrap); collaborators join via the join_trip RPC
create policy "trip_members_select" on public.trip_members for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_trip_member(trip_id));
create policy "trip_members_insert" on public.trip_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_id and t.created_by = (select auth.uid())
    )
  );
create policy "trip_members_update" on public.trip_members for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_trip_organizer(trip_id))
  with check (public.is_trip_member(trip_id));
create policy "trip_members_delete" on public.trip_members for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_trip_organizer(trip_id));

-- days: members read, organizers manage
create policy "days_select" on public.days for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "days_insert" on public.days for insert
  to authenticated with check (public.is_trip_organizer(trip_id));
create policy "days_update" on public.days for update
  to authenticated using (public.is_trip_organizer(trip_id))
  with check (public.is_trip_organizer(trip_id));
create policy "days_delete" on public.days for delete
  to authenticated using (public.is_trip_organizer(trip_id));

-- blocks: members read, organizers manage (trip resolved through days)
create policy "blocks_select" on public.blocks for select
  to authenticated
  using (exists (
    select 1 from public.days d
    where d.id = day_id and public.is_trip_member(d.trip_id)
  ));
create policy "blocks_insert" on public.blocks for insert
  to authenticated
  with check (exists (
    select 1 from public.days d
    where d.id = day_id and public.is_trip_organizer(d.trip_id)
  ));
create policy "blocks_update" on public.blocks for update
  to authenticated
  using (exists (
    select 1 from public.days d
    where d.id = day_id and public.is_trip_organizer(d.trip_id)
  ))
  with check (exists (
    select 1 from public.days d
    where d.id = day_id and public.is_trip_organizer(d.trip_id)
  ));
create policy "blocks_delete" on public.blocks for delete
  to authenticated
  using (exists (
    select 1 from public.days d
    where d.id = day_id and public.is_trip_organizer(d.trip_id)
  ));

-- activities: any trip member can manage (friends-trip model)
create policy "activities_select" on public.activities for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "activities_insert" on public.activities for insert
  to authenticated with check (public.is_trip_member(trip_id));
create policy "activities_update" on public.activities for update
  to authenticated using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));
create policy "activities_delete" on public.activities for delete
  to authenticated using (public.is_trip_member(trip_id));

-- block_proposals: members propose; proposer or organizer removes
create policy "block_proposals_select" on public.block_proposals for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "block_proposals_insert" on public.block_proposals for insert
  to authenticated
  with check (
    public.is_trip_member(trip_id)
    and created_by = public.my_member_id(trip_id)
  );
create policy "block_proposals_delete" on public.block_proposals for delete
  to authenticated
  using (
    created_by = public.my_member_id(trip_id)
    or public.is_trip_organizer(trip_id)
  );

-- votes: members read tallies; cast/remove only as yourself
create policy "votes_select" on public.votes for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "votes_insert" on public.votes for insert
  to authenticated
  with check (member_id = public.my_member_id(trip_id));
create policy "votes_update" on public.votes for update
  to authenticated
  using (member_id = public.my_member_id(trip_id))
  with check (member_id = public.my_member_id(trip_id));
create policy "votes_delete" on public.votes for delete
  to authenticated using (member_id = public.my_member_id(trip_id));

-- commits: members read; organizers commit/uncommit
create policy "commits_select" on public.commits for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "commits_insert" on public.commits for insert
  to authenticated
  with check (
    public.is_trip_organizer(trip_id)
    and committed_by = public.my_member_id(trip_id)
  );
create policy "commits_delete" on public.commits for delete
  to authenticated using (public.is_trip_organizer(trip_id));

-- restaurants: any trip member can manage
create policy "restaurants_select" on public.restaurants for select
  to authenticated using (public.is_trip_member(trip_id));
create policy "restaurants_insert" on public.restaurants for insert
  to authenticated with check (public.is_trip_member(trip_id));
create policy "restaurants_update" on public.restaurants for update
  to authenticated using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));
create policy "restaurants_delete" on public.restaurants for delete
  to authenticated using (public.is_trip_member(trip_id));

-- activity_restaurants: trip resolved through the activity
create policy "activity_restaurants_select" on public.activity_restaurants for select
  to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id and public.is_trip_member(a.trip_id)
  ));
create policy "activity_restaurants_insert" on public.activity_restaurants for insert
  to authenticated
  with check (exists (
    select 1 from public.activities a
    where a.id = activity_id and public.is_trip_member(a.trip_id)
  ));
create policy "activity_restaurants_delete" on public.activity_restaurants for delete
  to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id and public.is_trip_member(a.trip_id)
  ));

-- feedback: users insert/read their own rows
create policy "users_can_insert_own_feedback" on public.feedback for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users_can_read_own_feedback" on public.feedback for select
  to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Creates the trip and its organizer membership atomically. Hashes the PIN
-- server-side (bcrypt via pgcrypto) so the plaintext never persists and the
-- hash format is verifiable by join_trip.
create or replace function public.create_trip(
  p_name text,
  p_destination_text text,
  p_start_date date,
  p_end_date date,
  p_timezone text default 'UTC',
  p_currency text default 'USD',
  p_duplicate_policy text default 'soft_block',
  p_pin text default null,
  p_display_name text default null,
  p_lat double precision default null,
  p_lon double precision default null
)
returns public.trips
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_trip public.trips;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_pin is not null and p_pin !~ '^\d{4,8}$' then
    raise exception 'INVALID_PIN_FORMAT';
  end if;

  insert into public.trips (
    name, destination_text, start_date, end_date, timezone, currency,
    duplicate_policy, pin_hash, created_by, lat, lon
  )
  values (
    p_name, p_destination_text, p_start_date, p_end_date,
    coalesce(p_timezone, 'UTC'), coalesce(p_currency, 'USD'),
    coalesce(p_duplicate_policy, 'soft_block'),
    case when p_pin is null then null
         else extensions.crypt(p_pin, extensions.gen_salt('bf', 10)) end,
    v_uid, p_lat, p_lon
  )
  returning * into v_trip;

  insert into public.trip_members (trip_id, role, display_name, user_id)
  values (
    v_trip.id, 'organizer',
    coalesce(
      nullif(p_display_name, ''),
      (select split_part(email, '@', 1) from auth.users where id = v_uid),
      'Organizer'
    ),
    v_uid
  );

  return v_trip;
end;
$$;

-- Minimal trip info for the join page. Intentionally callable pre-auth (the
-- trip UUID in the invite link is the access secret); never exposes pin_hash.
create or replace function public.get_trip_join_info(p_trip_id uuid)
returns table (
  id uuid,
  name text,
  destination_text text,
  start_date date,
  end_date date,
  requires_pin boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, destination_text, start_date, end_date, (pin_hash is not null)
  from public.trips
  where id = p_trip_id;
$$;

-- Joins the calling user to a trip, verifying the PIN server-side.
-- Idempotent: re-joining returns the existing membership.
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
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_trip from public.trips where id = p_trip_id;
  if not found then
    raise exception 'TRIP_NOT_FOUND';
  end if;

  select * into v_member from public.trip_members
  where trip_id = p_trip_id and user_id = v_uid;
  if found then
    return v_member;
  end if;

  if v_trip.pin_hash is not null then
    if p_pin is null or extensions.crypt(p_pin, v_trip.pin_hash) <> v_trip.pin_hash then
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

  return v_member;
end;
$$;

-- Atomically swaps the committed activities of two blocks in the same trip.
create or replace function public.swap_block_commits(p_block_a uuid, p_block_b uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_a uuid;
  v_trip_b uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select d.trip_id into v_trip_a
  from public.blocks b join public.days d on d.id = b.day_id
  where b.id = p_block_a;
  select d.trip_id into v_trip_b
  from public.blocks b join public.days d on d.id = b.day_id
  where b.id = p_block_b;

  if v_trip_a is null or v_trip_b is null or v_trip_a <> v_trip_b then
    raise exception 'INVALID_BLOCKS';
  end if;
  if not public.is_trip_organizer(v_trip_a) then
    raise exception 'ORGANIZER_REQUIRED';
  end if;

  set constraints public.commits_block_id_key deferred;

  update public.commits c
  set block_id = case when c.block_id = p_block_a then p_block_b else p_block_a end
  where c.block_id in (p_block_a, p_block_b);
end;
$$;
