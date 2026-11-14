-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create a profiles table linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row-Level Security (RLS)
alter table public.profiles enable row level security;

-- Explicit grants (required on projects created after 2026-05-30, and on every
-- project for new tables after 2026-10-30; Supabase no longer auto-grants).
-- Grants decide if a role can touch the table at all; RLS decides which rows.
revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

-- RLS Policies for Profiles (owner-only)
-- Drop first so this file can be re-run safely
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- No INSERT policy on purpose: profiles are created only by the
-- handle_new_user() trigger below, so clients can't insert rows directly.

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql set search_path = '';

-- Trigger for updated_at on profiles
drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Function to automatically provision a profile row upon user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger linked to auth.users creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
