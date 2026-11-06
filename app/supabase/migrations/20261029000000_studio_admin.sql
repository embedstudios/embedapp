-- Hooks for the studio admin portal (embed.design/admin), which manages this
-- app's data server-side with the project's secret (service-role) key.
--
--   projects.external_ref     the admin portal's project (engagement) id
--   invoices.zoho_invoice_id  the Zoho Books invoice an app invoice mirrors
--   studio_* functions        client access management; service role only

alter table public.projects add column external_ref text unique;
alter table public.invoices add column zoho_invoice_id text unique;
alter table public.invoices add column currency text not null default 'INR';
alter table public.invoices add column amount numeric(12, 2);

-- Who can open a project in the app: accepted members plus pending invites.
create function public.studio_project_access(project uuid)
returns table (email text, full_name text, role text, has_account boolean, last_sign_in_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select coalesce(u.email, i.email), coalesce(nullif(p.full_name, ''), i.full_name, ''), coalesce(m.role, i.role),
         u.id is not null, u.last_sign_in_at
  from public.project_invites i
  left join auth.users u on lower(u.email) = lower(i.email)
  left join public.profiles p on p.id = u.id
  left join public.project_members m on m.project_id = i.project_id and m.user_id = u.id
  where i.project_id = project
  union
  select u.email, coalesce(p.full_name, ''), m.role, true, u.last_sign_in_at
  from public.project_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = u.id
  where m.project_id = project
    and not exists (select 1 from public.project_invites i where i.project_id = project and lower(i.email) = lower(u.email));
$$;

-- Give an email access to a project. If the person already has an account the
-- membership is added now; otherwise handle_new_user() adds it at sign-up.
create function public.studio_grant_access(project uuid, email text, full_name text, title text, role text default 'client')
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

create function public.studio_revoke_access(project uuid, email text)
returns void
language sql security definer set search_path = '' as $$
  delete from public.project_invites i
  where i.project_id = studio_revoke_access.project and lower(i.email) = lower(trim(studio_revoke_access.email));
  delete from public.project_members m using auth.users u
  where m.project_id = studio_revoke_access.project and m.user_id = u.id and lower(u.email) = lower(trim(studio_revoke_access.email));
$$;

revoke execute on function public.studio_project_access(uuid), public.studio_grant_access(uuid, text, text, text, text),
  public.studio_revoke_access(uuid, text) from public, anon, authenticated;
grant execute on function public.studio_project_access(uuid), public.studio_grant_access(uuid, text, text, text, text),
  public.studio_revoke_access(uuid, text) to service_role;
