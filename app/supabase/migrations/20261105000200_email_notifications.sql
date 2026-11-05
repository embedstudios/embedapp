-- Email notifications.
-- 1. A client's chat message pings the studio's server (embed.design), which
--    re-reads the message with the secret key and emails the studio. The ping
--    carries only the message id, so it needs no shared secret: the server
--    trusts the database, not the request. notified_at makes it send once.
-- 2. studio_notify_list(project) gives the server who on the client side
--    should get project emails (quotes): members and pending invites with the
--    client role, minus anyone who turned email off in their profile.

create extension if not exists pg_net with schema extensions;

alter table public.messages add column if not exists notified_at timestamptz;

create or replace function public.ping_studio_on_client_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.from_client then
    perform net.http_post(
      url := 'https://embed.design/api/clientapp/hooks/message',
      body := jsonb_build_object('id', new.id),
      headers := '{"content-type": "application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );
  end if;
  return new;
end $$;
revoke execute on function public.ping_studio_on_client_message() from public, anon, authenticated;

drop trigger if exists messages_ping_studio on public.messages;
create trigger messages_ping_studio after insert on public.messages
  for each row execute function public.ping_studio_on_client_message();

create or replace function public.studio_notify_list(project uuid)
returns table (email text, full_name text)
language sql stable security definer set search_path = '' as $$
  select u.email, coalesce(nullif(p.full_name, ''), '')
  from public.project_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = u.id
  where m.project_id = project and m.role = 'client' and coalesce(p.notify, true)
  union
  select i.email, coalesce(i.full_name, '')
  from public.project_invites i
  where i.project_id = project and i.role = 'client'
    and not exists (select 1 from auth.users u where lower(u.email) = lower(i.email))
$$;
revoke execute on function public.studio_notify_list(uuid) from public, anon, authenticated;
grant execute on function public.studio_notify_list(uuid) to service_role;
