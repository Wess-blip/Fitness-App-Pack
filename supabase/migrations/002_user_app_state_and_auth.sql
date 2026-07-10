-- Run after 001_initial_schema.sql.
-- Stores the modular UI state while keeping the normalized logging tables available.
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;
create policy "app state self access" on public.user_app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Automatically create a profile row for Google/email sign-ins.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
