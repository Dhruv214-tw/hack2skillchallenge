-- supabase/schema.sql
-- Run this in your Supabase project SQL editor

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  exam_type text not null default 'Other',
  created_at timestamptz not null default now()
);

-- Mood check-ins table
create table if not exists mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  mood_score int not null check (mood_score between 1 and 5),
  note text default '',
  stress_triggers text[] default '{}',
  created_at timestamptz not null default now()
);

-- Journal entries table
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  mood_tag int check (mood_tag between 1 and 5),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table mood_checkins enable row level security;
alter table journal_entries enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own checkins"
  on mood_checkins for select using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on mood_checkins for insert with check (auth.uid() = user_id);

create policy "Users can update own checkins"
  on mood_checkins for update using (auth.uid() = user_id);

create policy "Users can delete own checkins"
  on mood_checkins for delete using (auth.uid() = user_id);

create policy "Users can view own journal entries"
  on journal_entries for select using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on journal_entries for insert with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on journal_entries for update using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on journal_entries for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, exam_type)
  values (new.id, '', 'Other');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
