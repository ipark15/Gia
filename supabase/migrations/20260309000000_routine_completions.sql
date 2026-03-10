-- routine_completions: one row per routine completion (morning or evening) with timestamp
-- Replaces aggregated completed_days for historical tracking; completed_days kept for backward compat during migration
create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  type text not null check (type in ('morning', 'evening'))
);

create index routine_completions_user_completed on public.routine_completions(user_id, completed_at desc);

alter table public.routine_completions enable row level security;

create policy "Users can manage own routine_completions"
  on public.routine_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill from completed_days so existing users keep their history
insert into public.routine_completions (user_id, completed_at, type)
select user_id, (date + interval '12 hours')::timestamptz, 'morning'
from public.completed_days where morning_done = true;

insert into public.routine_completions (user_id, completed_at, type)
select user_id, (date + interval '12 hours')::timestamptz, 'evening'
from public.completed_days where evening_done = true;
