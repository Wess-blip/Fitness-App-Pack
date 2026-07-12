-- Applied to the linked Supabase project on 2026-07-12.
-- Keeps the coach/client authorization helper available to RLS without exposing it as a public RPC.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.can_access_client(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = target_user
    or exists(
      select 1 from public.coach_clients cc
      where cc.coach_id = (select auth.uid())
        and cc.client_id = target_user
        and cc.active
    )
    or exists(
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role = 'admin'
    );
$$;

revoke all on function private.can_access_client(uuid) from public, anon;
grant execute on function private.can_access_client(uuid) to authenticated, service_role;

alter policy "calibration access" on public.calibration_runs using (private.can_access_client(user_id));
alter policy "activity access" on public.daily_activity using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "nutrition access" on public.daily_nutrition using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "goals access" on public.goals using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "health sample access" on public.health_samples using (private.can_access_client(user_id));
alter policy "meals access" on public.meal_entries using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "measurements access" on public.measurements using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "model run access" on public.model_runs using (private.can_access_client(user_id));
alter policy "profile self or assigned coach" on public.profiles using (private.can_access_client(user_id));
alter policy "schedule access" on public.workout_schedules using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "session access" on public.workout_sessions using (private.can_access_client(user_id)) with check (private.can_access_client(user_id));
alter policy "set access" on public.set_logs
  using (exists(select 1 from public.workout_sessions ws where ws.id = set_logs.workout_session_id and private.can_access_client(ws.user_id)))
  with check (exists(select 1 from public.workout_sessions ws where ws.id = set_logs.workout_session_id and private.can_access_client(ws.user_id)));

drop function public.can_access_client(uuid);
