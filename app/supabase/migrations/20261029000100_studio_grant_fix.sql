-- Live fix for 20261029000000 (ON CONFLICT (email) was ambiguous with the parameter);
-- the original file already carries the #variable_conflict directive, so this is a no-op on fresh setups.
create or replace function public.studio_grant_access(project uuid, email text, full_name text, title text, role text default 'client')
returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare uid uuid;
begin
  insert into public.project_invites (email, project_id, role, full_name, title)
  values (lower(trim(studio_grant_access.email)), studio_grant_access.project, studio_grant_access.role,
          coalesce(studio_grant_access.full_name, ''), coalesce(studio_grant_access.title, ''))
  on conflict (email, project_id) do update set role = excluded.role,
    full_name = coalesce(nullif(excluded.full_name, ''), public.project_invites.full_name),
    title = coalesce(nullif(excluded.title, ''), public.project_invites.title);
  select id into uid from auth.users where lower(auth.users.email) = lower(trim(studio_grant_access.email));
  if uid is not null then
    insert into public.project_members (project_id, user_id, role) values (studio_grant_access.project, uid, studio_grant_access.role)
    on conflict (project_id, user_id) do update set role = excluded.role;
    update public.profiles pr set full_name = studio_grant_access.full_name
    where pr.id = uid and pr.full_name = '' and coalesce(studio_grant_access.full_name, '') <> '';
  end if;
end $$;


revoke execute on function public.studio_grant_access(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.studio_grant_access(uuid, text, text, text, text) to service_role;
