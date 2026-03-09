-- Gia app: initial schema for Supabase
-- Run this in Supabase SQL Editor or via: supabase db push

-- Profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  primary_condition text,
  conditions text[] default '{}',
  other_condition text,
  severity text,
  skin_satisfaction_baseline smallint,
  days_per_week smallint default 3,
  times_of_day text[] default '{}',
  has_dermatologist_plan boolean,
  dermatologist_products jsonb default '[]',
  selected_treatment_plans jsonb default '{}',
  selected_treatment_plan_id text,
  next_derm_appointment date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Completed days: routine completion for streaks and adherence
create table public.completed_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  steps_completed smallint not null default 0,
  total_steps smallint not null default 0,
  morning_done boolean not null default false,
  evening_done boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

create index completed_days_user_date on public.completed_days(user_id, date desc);

alter table public.completed_days enable row level security;

create policy "Users can manage own completed_days"
  on public.completed_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Check-ins: timeline / quick check-in data (Insights)
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  routine_completed boolean not null default false,
  mood text,
  skin_feeling smallint,
  flare_tags text[] default '{}',
  context_tags text[] default '{}',
  note text,
  sleep_hours numeric,
  stress_level smallint,
  on_period boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index check_ins_user_date on public.check_ins(user_id, date desc);

alter table public.check_ins enable row level security;

create policy "Users can manage own check_ins"
  on public.check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Progress photos
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  storage_path text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index progress_photos_user_date on public.progress_photos(user_id, date desc);

alter table public.progress_photos enable row level security;

create policy "Users can manage own progress_photos"
  on public.progress_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owned products (inventory / routine)
create table public.owned_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  name text not null,
  step text,
  category text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index owned_products_user on public.owned_products(user_id);

alter table public.owned_products enable row level security;

create policy "Users can manage own owned_products"
  on public.owned_products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for progress photos (run in Dashboard or add via API)
-- insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', true);
-- create policy "Users can upload own progress photos" on storage.objects for insert with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can read own progress photos" on storage.objects for select using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can update/delete own progress photos" on storage.objects for update using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
