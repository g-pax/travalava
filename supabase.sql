-- Feedback system schema
-- Run this in Supabase SQL editor

-- Create feedback table
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('bug','idea','other')) not null,
  severity text check (severity in ('S1','S2','S3','S4')) default 'S3',
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
  screenshot_path text,   -- R2 object key
  ip_hash text,
  created_at timestamptz default now()
);

-- Create indexes
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_route_idx on public.feedback (route);
create index if not exists feedback_user_idx on public.feedback (user_id);

-- Enable RLS
alter table public.feedback enable row level security;

-- Policy for users to insert their own feedback
create policy "users_can_insert_own_feedback" on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy for users to read their own feedback (optional - for future admin features)
create policy "users_can_read_own_feedback" on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy for service role to insert any feedback (for server-side operations)
create policy "service_role_all_access" on public.feedback
  to service_role
  using (true)
  with check (true);

-- Screenshots are now stored in Cloudflare R2 at /feedback/ folder
-- No Supabase storage bucket needed