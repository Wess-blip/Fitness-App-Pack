-- Applied to the linked Supabase project on 2026-07-12.
-- Keeps trigger helpers out of the public RPC surface and scopes user state to its owner.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.can_access_client(uuid) from public, anon;
grant execute on function public.can_access_client(uuid) to authenticated, service_role;

drop policy if exists "app state self access" on public.user_app_state;
create policy "app state self access"
on public.user_app_state
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "health connection self" on public.health_connections;
create policy "health connection self"
on public.health_connections
for select
to authenticated
using ((select auth.uid()) = user_id);
