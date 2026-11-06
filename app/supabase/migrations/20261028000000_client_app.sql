-- Embed client app — schema, row-level security and client RPCs.
--
-- Access model
--   * Clients are invite-only. A studio lead adds a row to project_invites and
--     invites the email from the Supabase dashboard (Auth → Invite user). When
--     the auth user is created, handle_new_user() creates the profile and turns
--     pending invites into project memberships.
--   * Clients can read everything on projects they belong to. They change data
--     only through the security-definer RPCs at the bottom of this file, plus
--     inserting chat messages and editing their own profile.
--   * Studio members (project_members.role = 'studio') get full write access
--     on their projects, so a studio-side tool can post quotes, invoices, etc.

create extension if not exists pgcrypto;

create type public.phase_key as enum ('research', 'strategy', 'ideation', 'design', 'handover');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  title text not null default '',
  currency text not null default 'INR' check (currency in ('INR', 'USD')),
  notify boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subtitle text not null default '',
  status text not null default 'active' check (status in ('proposal', 'active', 'complete')),
  current_phase public.phase_key not null default 'research',
  progress smallint not null default 0 check (progress between 0 and 100),
  phase_summary text not null default 'On track',
  start_on date,
  due_on date,
  contract_inr numeric(12, 2),
  lead_name text not null default 'Arnav',
  -- New-project brief (status = 'proposal')
  services text[] not null default '{}',
  brief text,
  goal text,
  budget_label text,
  timing text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'studio')),
  primary key (project_id, user_id)
);
create index on public.project_members (user_id);

create table public.project_invites (
  email text not null,
  project_id uuid not null references public.projects (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'studio')),
  full_name text not null default '',
  title text not null default '',
  primary key (email, project_id)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  role text not null,
  position smallint not null default 0
);
create index on public.team_members (project_id);

create table public.phases (
  project_id uuid not null references public.projects (id) on delete cascade,
  key public.phase_key not null,
  now_label text not null default '',
  blurb text not null default '',
  primary key (project_id, key)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase public.phase_key not null,
  title text not null,
  kind text not null,
  meta text not null default '',
  note text not null default '',
  owner_name text not null,
  due_on date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes')),
  feedback text,
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  preview_url text,
  figma_url text,
  created_at timestamptz not null default now()
);
create index on public.approvals (project_id);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase public.phase_key not null,
  name text not null,
  status text not null default 'upcoming' check (status in ('done', 'review', 'progress', 'upcoming')),
  note text not null default '',
  approval_id uuid references public.approvals (id) on delete set null,
  position smallint not null default 0
);
create index on public.deliverables (project_id);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase public.phase_key not null,
  name text not null,
  ext text not null,
  meta text not null default '',
  url text,
  position smallint not null default 0
);
create index on public.project_files (project_id);

create table public.scope_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  ref text not null,
  title text not null,
  summary text not null default '',
  status text not null default 'reviewing' check (status in ('reviewing', 'quoted', 'accepted', 'declined')),
  -- Brief, as submitted by the client
  types text[] not null default '{}',
  description text not null default '',
  goal text,
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'Urgent')),
  timing text not null default 'Flexible',
  -- Quote, as posted by the studio
  price_inr numeric(12, 2),
  timeline text,
  new_due_on date,
  valid_until date,
  quote_note text,
  accepted_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, ref)
);
create index on public.scope_requests (project_id);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.scope_requests (id) on delete cascade,
  name text not null,
  qty text not null default '',
  amount_inr numeric(12, 2) not null,
  position smallint not null default 0
);
create index on public.quote_lines (request_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  request_id uuid references public.scope_requests (id) on delete set null,
  ref text not null,
  title text not null,
  amount_inr numeric(12, 2) not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'due', 'paid')),
  due_on date,
  paid_on date,
  payment_url text,
  receipt_url text,
  created_at timestamptz not null default now()
);
create index on public.invoices (project_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  from_client boolean not null,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index on public.messages (project_id, created_at);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  body text not null,
  actor_name text not null,
  created_at timestamptz not null default now()
);
create index on public.activity (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Membership helpers
-- ---------------------------------------------------------------------------

create function public.is_member(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members m where m.project_id = p and m.user_id = auth.uid());
$$;

create function public.is_studio(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members m where m.project_id = p and m.user_id = auth.uid() and m.role = 'studio');
$$;

create function public.my_name() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(p.full_name, ''), 'You') from public.profiles p where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.team_members enable row level security;
alter table public.phases enable row level security;
alter table public.approvals enable row level security;
alter table public.deliverables enable row level security;
alter table public.project_files enable row level security;
alter table public.scope_requests enable row level security;
alter table public.quote_lines enable row level security;
alter table public.invoices enable row level security;
alter table public.messages enable row level security;
alter table public.activity enable row level security;

create policy "own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read" on public.projects for select to authenticated using (public.is_member(id));
create policy "studio writes" on public.projects for update to authenticated using (public.is_studio(id));

create policy "members read" on public.project_members for select to authenticated using (public.is_member(project_id));
create policy "studio invites" on public.project_invites for all to authenticated
  using (public.is_studio(project_id)) with check (public.is_studio(project_id));

-- Read for members, full write for studio, on every per-project table.
do $$
declare t text;
begin
  foreach t in array array['team_members', 'phases', 'approvals', 'deliverables', 'project_files', 'scope_requests', 'invoices', 'activity'] loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(project_id))', t);
    execute format('create policy "studio writes" on public.%I for all to authenticated using (public.is_studio(project_id)) with check (public.is_studio(project_id))', t);
  end loop;
end $$;

create policy "members read" on public.quote_lines for select to authenticated using (
  exists (select 1 from public.scope_requests r where r.id = request_id and public.is_member(r.project_id)));
create policy "studio writes" on public.quote_lines for all to authenticated using (
  exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)))
  with check (exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)));

create policy "members read" on public.messages for select to authenticated using (public.is_member(project_id));
create policy "members post as themselves" on public.messages for insert to authenticated
  with check (public.is_member(project_id) and author_id = (select auth.uid()));

-- Author name and side are derived server-side so they can't be spoofed.
create function public.stamp_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.author_id is not null then
    new.author_name := public.my_name();
    new.from_client := not public.is_studio(new.project_id);
  end if;
  return new;
end $$;
create trigger stamp_message before insert on public.messages for each row execute function public.stamp_message();

-- ---------------------------------------------------------------------------
-- New users: profile + memberships from invites
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare inv record;
begin
  select full_name, title into inv from public.project_invites where lower(email) = lower(new.email) limit 1;
  insert into public.profiles (id, full_name, title)
  values (new.id, coalesce(inv.full_name, ''), coalesce(inv.title, ''))
  on conflict (id) do nothing;
  insert into public.project_members (project_id, user_id, role)
  select project_id, new.id, role from public.project_invites where lower(email) = lower(new.email)
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Client actions (RPC)
-- ---------------------------------------------------------------------------

-- How long a client can take back an approval or a quote acceptance.
create function public.undo_window() returns interval language sql immutable as $$ select interval '2 minutes' $$;

create function public.approve(approval uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  select * into a from public.approvals where id = approval for update;
  if a.id is null or not public.is_member(a.project_id) then raise exception 'not found'; end if;
  if a.status <> 'pending' then raise exception 'already decided'; end if;
  update public.approvals set status = 'approved', decided_at = now(), decided_by = auth.uid(), feedback = null where id = approval;
  update public.deliverables set status = 'done', note = 'Approved' where approval_id = approval;
  insert into public.activity (project_id, body, actor_name) values (a.project_id, a.title || ' approved', public.my_name());
end $$;

create function public.request_changes(approval uuid, feedback text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  if length(trim(feedback)) < 12 then raise exception 'feedback too short'; end if;
  select * into a from public.approvals where id = approval for update;
  if a.id is null or not public.is_member(a.project_id) then raise exception 'not found'; end if;
  if a.status <> 'pending' then raise exception 'already decided'; end if;
  update public.approvals set status = 'changes', feedback = trim(request_changes.feedback), decided_at = now(), decided_by = auth.uid() where id = approval;
  insert into public.messages (project_id, author_id, author_name, from_client, body)
  values (a.project_id, auth.uid(), public.my_name(), true, 'Changes on “' || a.title || '”: ' || trim(request_changes.feedback));
end $$;

create function public.undo_approval(approval uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.approvals;
begin
  select * into a from public.approvals where id = approval for update;
  if a.id is null or not public.is_member(a.project_id) then raise exception 'not found'; end if;
  if a.status <> 'approved' or a.decided_by <> auth.uid() or a.decided_at < now() - public.undo_window() then
    raise exception 'too late to undo';
  end if;
  update public.approvals set status = 'pending', decided_at = null, decided_by = null where id = approval;
  update public.deliverables set status = 'review', note = 'In review' where approval_id = approval;
  delete from public.activity where project_id = a.project_id and body = a.title || ' approved' and created_at >= a.decided_at;
end $$;

create function public.submit_scope_request(
  project uuid, types text[], description text, goal text, priority text, timing text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare n int; rid uuid; t text;
begin
  if not public.is_member(project) then raise exception 'not found'; end if;
  if coalesce(array_length(types, 1), 0) = 0 or length(trim(description)) < 10 then raise exception 'brief incomplete'; end if;
  select count(*) + 1 into n from public.scope_requests where project_id = project;
  t := left(split_part(split_part(trim(description), '.', 1), E'\n', 1), 48);
  insert into public.scope_requests (project_id, ref, title, summary, types, description, goal, priority, timing, created_by)
  values (project, 'SCR-' || lpad(n::text, 2, '0'), t,
          array_to_string(types, ', ') || ' · ' || priority || ' · ' || coalesce(nullif(timing, ''), 'Flexible'),
          types, trim(description), nullif(trim(goal), ''), priority, coalesce(nullif(timing, ''), 'Flexible'), auth.uid())
  returning id into rid;
  insert into public.activity (project_id, body, actor_name) values (project, 'Scope brief sent: “' || t || '”', public.my_name());
  return rid;
end $$;

create function public.accept_quote(request uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare r public.scope_requests; n int; inv uuid;
begin
  select * into r from public.scope_requests where id = request for update;
  if r.id is null or not public.is_member(r.project_id) then raise exception 'not found'; end if;
  if r.status <> 'quoted' then raise exception 'no open quote'; end if;
  if r.valid_until is not null and r.valid_until < current_date then raise exception 'quote expired'; end if;
  update public.scope_requests set status = 'accepted', accepted_at = now() where id = request;
  select count(*) into n from public.invoices;
  insert into public.invoices (project_id, request_id, ref, title, amount_inr, status, due_on)
  values (r.project_id, r.id, 'INV-' || lpad((152 + n)::text, 4, '0'), 'Scope: ' || r.title || ' (50%)', r.price_inr / 2, 'scheduled', current_date + 7)
  returning id into inv;
  insert into public.activity (project_id, body, actor_name) values (r.project_id, 'Quote accepted: “' || r.title || '”', public.my_name());
  return inv;
end $$;

create function public.undo_accept_quote(request uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.scope_requests;
begin
  select * into r from public.scope_requests where id = request for update;
  if r.id is null or not public.is_member(r.project_id) then raise exception 'not found'; end if;
  if r.status <> 'accepted' or r.accepted_at < now() - public.undo_window() then raise exception 'too late to undo'; end if;
  update public.scope_requests set status = 'quoted', accepted_at = null where id = request;
  delete from public.invoices where request_id = request and status = 'scheduled';
  delete from public.activity where project_id = r.project_id and body = 'Quote accepted: “' || r.title || '”' and created_at >= r.accepted_at;
end $$;

create function public.submit_project_brief(
  name text, services text[], brief text, goal text, budget_label text, timing text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if length(trim(name)) = 0 or coalesce(array_length(services, 1), 0) = 0 or length(trim(brief)) < 10 then
    raise exception 'brief incomplete';
  end if;
  insert into public.projects (name, subtitle, status, services, brief, goal, budget_label, timing, created_by)
  values (trim(name), services[1], 'proposal', services, trim(brief), nullif(trim(goal), ''),
          coalesce(nullif(budget_label, ''), 'Not sure yet'), coalesce(nullif(timing, ''), 'Flexible'), auth.uid())
  returning id into pid;
  insert into public.project_members (project_id, user_id, role) values (pid, auth.uid(), 'client');
  insert into public.phases (project_id, key)
  select pid, k from unnest(enum_range(null::public.phase_key)) k;
  return pid;
end $$;

-- Only signed-in users may call the RPCs; helpers stay internal.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.approve(uuid), public.request_changes(uuid, text), public.undo_approval(uuid),
  public.submit_scope_request(uuid, text[], text, text, text, text), public.accept_quote(uuid),
  public.undo_accept_quote(uuid), public.submit_project_brief(text, text[], text, text, text, text),
  public.is_member(uuid), public.is_studio(uuid), public.my_name(), public.undo_window()
  to authenticated;

-- Live chat
alter publication supabase_realtime add table public.messages;
