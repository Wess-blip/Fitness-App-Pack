create extension if not exists pgcrypto;

create type public.app_role as enum ('client','coach','admin');
create type public.goal_mode as enum ('lose','maintain','gain','recomp');
create type public.activity_mode as enum ('wearable-total','manual-total','components');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text,
  role public.app_role not null default 'client',
  timezone text not null default 'Asia/Singapore',
  unit_system text not null default 'metric' check (unit_system in ('metric','imperial')),
  sex_for_formula text check (sex_for_formula in ('male','female')),
  birth_date date,
  height_cm numeric,
  body_fat_confidence text default 'medium' check (body_fat_confidence in ('none','low','medium','high')),
  training_experience text default 'novice' check (training_experience in ('novice','intermediate','advanced')),
  activity_defaults jsonb not null default '{"mode":"components","baseNonExerciseActiveKcal":300}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_clients (
  coach_id uuid references public.profiles(user_id) on delete cascade,
  client_id uuid references public.profiles(user_id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  mode public.goal_mode not null,
  target_weight_kg numeric,
  target_body_fat_pct numeric,
  target_weekly_rate_pct numeric not null default 0.005,
  calorie_plan_mode text not null default 'goal-driven' check (calorie_plan_mode in ('fixed','goal-driven')),
  fixed_calories numeric,
  planned_protein_g numeric,
  planned_fat_g numeric,
  sessions_per_week integer not null default 3,
  on_target text not null default 'stop' check (on_target in ('stop','maintenance')),
  active boolean not null default true,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create unique index goals_one_active_per_user on public.goals(user_id) where active;

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg numeric,
  waist_cm numeric,
  neck_cm numeric,
  hip_cm numeric,
  manual_body_fat_pct numeric,
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);
create index measurements_user_date on public.measurements(user_id, measured_at desc);

create table public.daily_nutrition (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  log_date date not null,
  calories numeric not null default 0,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  alcohol_g numeric,
  complete boolean not null default false,
  source text not null default 'manual',
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  eaten_at timestamptz not null,
  meal_type text,
  name text not null,
  calories numeric not null,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  confidence text check (confidence in ('low','medium','high')),
  source text not null default 'manual',
  include_in_totals boolean not null default true,
  confirmed_by_user boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  log_date date not null,
  mode public.activity_mode not null,
  wearable_active_kcal numeric,
  manual_total_active_kcal numeric,
  base_non_exercise_active_kcal numeric,
  steps integer,
  workout jsonb,
  source text not null default 'manual',
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table public.exercise_library (
  id text primary key,
  name text not null,
  equipment text,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  instructions text,
  safety_notes text
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(user_id) on delete set null,
  name text not null,
  version text not null,
  program_type text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  sequence integer not null,
  slug text not null,
  name text not null,
  infographic_path text,
  stretches jsonb not null default '[]'::jsonb,
  unique(program_id, sequence)
);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  exercise_id text not null references public.exercise_library(id),
  sequence integer not null,
  sets_min integer not null,
  sets_max integer not null,
  rep_min integer not null,
  rep_max integer not null,
  target_rir numeric not null default 2,
  rest_seconds integer not null default 90,
  notes text,
  unique(program_day_id, sequence)
);

create table public.workout_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  program_id uuid not null references public.programs(id),
  frequency integer not null check (frequency in (3,6)),
  weekdays integer[] not null,
  start_date date not null,
  active boolean not null default true
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  program_day_id uuid references public.program_days(id),
  started_at timestamptz not null,
  completed_at timestamptz,
  session_rpe numeric,
  notes text
);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id text not null references public.exercise_library(id),
  set_number integer not null,
  weight_kg numeric,
  reps integer,
  rir numeric,
  pain_flag boolean not null default false,
  notes text
);

create table public.health_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  provider text not null check (provider in ('apple_health')),
  token_hash text not null,
  active boolean not null default true,
  paired_at timestamptz not null default now(),
  last_sync_at timestamptz,
  unique(user_id, provider)
);

create table public.health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  provider text not null,
  sample_type text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  numeric_value numeric not null,
  unit text not null,
  source_name text,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider, sample_type, external_id)
);

create table public.model_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  engine_version text not null,
  settings jsonb not null,
  active boolean not null default true,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table public.calibration_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  calculated_at timestamptz not null default now(),
  window_start date not null,
  window_end date not null,
  data_days integer not null,
  raw_factor numeric not null,
  applied_factor numeric not null,
  calibrated_tdee_kcal numeric not null,
  regression_r2 numeric,
  residual_mae_kg numeric,
  confidence text not null,
  confidence_score numeric not null,
  warnings jsonb not null default '[]'::jsonb,
  engine_version text not null
);

create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  calculated_at timestamptz not null default now(),
  engine_version text not null,
  input_snapshot jsonb not null,
  output_snapshot jsonb not null,
  confidence text
);

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.measurements enable row level security;
alter table public.daily_nutrition enable row level security;
alter table public.meal_entries enable row level security;
alter table public.daily_activity enable row level security;
alter table public.workout_schedules enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.health_connections enable row level security;
alter table public.health_samples enable row level security;
alter table public.calibration_runs enable row level security;
alter table public.model_runs enable row level security;

create or replace function public.can_access_client(target_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() = target_user
    or exists(select 1 from public.coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = target_user and cc.active)
    or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin');
$$;

create policy "profile self or assigned coach" on public.profiles for select using (public.can_access_client(user_id));
create policy "profile self update" on public.profiles for update using (auth.uid() = user_id);

create policy "goals access" on public.goals for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "measurements access" on public.measurements for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "nutrition access" on public.daily_nutrition for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "meals access" on public.meal_entries for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "activity access" on public.daily_activity for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "schedule access" on public.workout_schedules for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "session access" on public.workout_sessions for all using (public.can_access_client(user_id)) with check (public.can_access_client(user_id));
create policy "set access" on public.set_logs for all using (exists(select 1 from public.workout_sessions ws where ws.id = workout_session_id and public.can_access_client(ws.user_id))) with check (exists(select 1 from public.workout_sessions ws where ws.id = workout_session_id and public.can_access_client(ws.user_id)));
create policy "health connection self" on public.health_connections for select using (auth.uid() = user_id);
create policy "health sample access" on public.health_samples for select using (public.can_access_client(user_id));
create policy "calibration access" on public.calibration_runs for select using (public.can_access_client(user_id));
create policy "model run access" on public.model_runs for select using (public.can_access_client(user_id));

insert into storage.buckets (id, name, public) values ('food-images','food-images',false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('progress-images','progress-images',false) on conflict do nothing;
create policy "private user uploads" on storage.objects for all using (bucket_id in ('food-images','progress-images') and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id in ('food-images','progress-images') and (storage.foldername(name))[1] = auth.uid()::text);
