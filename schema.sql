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

-- RLS Policies for Profiles (owner-only)
-- Drop first so this file can be re-run safely
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists