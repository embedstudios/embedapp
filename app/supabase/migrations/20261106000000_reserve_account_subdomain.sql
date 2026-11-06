-- account.embed.design is the portal's one passkey address (Supabase allows at
-- most 5 WebAuthn origins, and every project has its own subdomain), so no
-- project may take it.
alter table public.projects drop constraint projects_subdomain_check;
alter table public.projects add constraint projects_subdomain_check check (
  subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$'
  and subdomain not in ('www','app','admin','api','mail','email','smtp','ftp','blog','help','docs','status','cdn','static','assets','portal','studio','dashboard','account','auth','login','id')
);
