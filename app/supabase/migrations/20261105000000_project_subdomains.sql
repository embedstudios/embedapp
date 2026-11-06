-- Web app subdomains: each project can be opened at <subdomain>.embed.design.
--
-- The web app only knows the subdomain before sign-in, so brand_card() gives
-- the sign-in page the brand name to show, and nothing else. Everything else
-- still goes through RLS: a signed-in person who isn't a member of the
-- project sees nothing (the web app then explains how to get access).

alter table public.projects add column subdomain text unique
  check (subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$'
         and subdomain not in ('www', 'app', 'admin', 'api', 'mail', 'email', 'smtp', 'ftp', 'blog', 'help', 'docs', 'status', 'cdn', 'static', 'assets', 'portal', 'studio', 'dashboard'));

create function public.brand_card(sub text)
returns table (name text, subtitle text)
language sql stable security definer set search_path = '' as $$
  select p.name, p.subtitle from public.projects p where p.subdomain = lower(sub) limit 1;
$$;
revoke execute on function public.brand_card(text) from public;
grant execute on function public.brand_card(text) to anon, authenticated;
