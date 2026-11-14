-- Audits from the audit tool at embed.design, shown on the portal's Audits tab.
-- The studio admin portal (api/clientapp.mjs syncAppAudits) publishes them with
-- the service-role key: every audit whose buyer email belongs to a member of the
-- project, plus any the studio links by hand. Members only read.
-- projects.website is the client's own site, offered for the free first look.

alter table public.projects add column website text;

create table public.audits (
  project_id uuid not null references public.projects (id) on delete cascade,
  token text not null,
  kind text not null default 'url' check (kind in ('url', 'app', 'screens', 'figma')),
  target text not null default '',
  name text not null default '',
  status text not null default 'collecting' check (status in ('collecting', 'first_look', 'auditing', 'ready', 'delayed')),
  paid boolean not null default false,
  reaudit boolean not null default false,
  overall smallint check (overall between 0 and 100),
  scores jsonb not null default '{}'::jsonb,
  verdict text not null default '',
  findings smallint,
  report_url text not null,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (project_id, token)
);
create index on public.audits (project_id, created_at desc);

alter table public.audits enable row level security;
create policy "members read" on public.audits for select to authenticated using (public.is_member(project_id));
create policy "studio inserts" on public.audits for insert to authenticated with check (public.is_studio(project_id));
create policy "studio updates" on public.audits for update to authenticated using (public.is_studio(project_id)) with check (public.is_studio(project_id));
create policy "studio deletes" on public.audits for delete to authenticated using (public.is_studio(project_id));
