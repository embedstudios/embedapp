-- Retainers: a project can be a one-off project, a retainer, or both.
--   projects.engagement      'project' (one-off, phases), 'retainer', or 'both'
--   projects.retainer_hours  hours included each month (null: no set allowance)
-- A retainer has to-dos (clients add them day to day; Embed comments, works on
-- them, sends them for review; the client signs off) and a timesheet (Embed logs
-- time against to-dos, by person and day). The admin portal writes with the
-- service role; clients act only through the RPCs below and by commenting.

alter table public.projects
  add column if not exists engagement text not null default 'project' check (engagement in ('project', 'retainer', 'both')),
  add column if not exists retainer_hours numeric(6, 1) check (retainer_hours is null or retainer_hours > 0);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  ref text not null,
  title text not null check (length(trim(title)) > 0),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'progress', 'review', 'done')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  due_on date,
  from_client boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text not null default '',
  done_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, ref)
);
create index on public.todos (project_id, created_at desc);
create index on public.todos (created_by);

create table public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  from_client boolean not null,
  body text not null check (length(trim(body)) > 0),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.todo_comments (todo_id, created_at);
create index on public.todo_comments (project_id);
create index on public.todo_comments (author_id);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  todo_id uuid references public.todos (id) on delete set null,
  person_name text not null default '',
  description text not null default '',
  work_on date not null default current_date,
  minutes integer not null default 0 check (minutes between 0 and 1440),
  billable boolean not null default true,
  -- A running timer: started_at set, minutes filled in when it stops.
  running boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.time_entries (project_id, work_on desc);
create index on public.time_entries (todo_id);

alter table public.todos enable row level security;
alter table public.todo_comments enable row level security;
alter table public.time_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['todos', 'time_entries'] loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(project_id))', t);
    execute format('create policy "studio inserts" on public.%I for insert to authenticated with check (public.is_studio(project_id))', t);
    execute format('create policy "studio updates" on public.%I for update to authenticated using (public.is_studio(project_id)) with check (public.is_studio(project_id))', t);
    execute format('create policy "studio deletes" on public.%I for delete to authenticated using (public.is_studio(project_id))', t);
  end loop;
end $$;

create policy "members read" on public.todo_comments for select to authenticated using (public.is_member(project_id));
create policy "members comment as themselves" on public.todo_comments for insert to authenticated
  with check (public.is_member(project_id) and author_id = (select auth.uid())
    and exists (select 1 from public.todos t where t.id = todo_id and t.project_id = todo_comments.project_id));
-- Author name and side come from the database, as for chat messages.
create trigger stamp_todo_comment before insert on public.todo_comments for each row execute function public.stamp_message();

-- ---------------------------------------------------------------------------
-- Client actions
-- ---------------------------------------------------------------------------

-- A client adds a to-do. Refs are TD-1, TD-2… per project, after the highest.
create or replace function public.add_todo(project uuid, title text, details text, priority text, due_on date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare n int; tid uuid;
begin
  if not public.is_member(project) then raise exception 'not found'; end if;
  if length(trim(coalesce(title, ''))) < 3 then raise exception 'title too short'; end if;
  if not exists (select 1 from public.projects p where p.id = project and p.engagement in ('retainer', 'both')) then raise exception 'not a retainer'; end if;
  select coalesce(max(nullif(substring(ref from '(\d+)$'), '')::int), 0) + 1 into n from public.todos where project_id = project;
  insert into public.todos (project_id, ref, title, details, priority, due_on, from_client, created_by, created_by_name)
  values (project, 'TD-' || n, left(trim(title), 160), left(trim(coalesce(details, '')), 4000),
          case when priority = 'urgent' then 'urgent' else 'normal' end, due_on,
          not public.is_studio(project), auth.uid(), public.my_name())
  returning id into tid;
  insert into public.activity (project_id, body, actor_name) values (project, 'To-do added: “' || left(trim(title), 80) || '”', public.my_name());
  return tid;
end $$;

-- The client's side of a to-do: sign off one in review, send it back with a
-- note, or withdraw one they added that nobody has started.
create or replace function public.todo_action(todo uuid, action text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.todos;
begin
  select * into t from public.todos where id = todo for update;
  if t.id is null or not public.is_member(t.project_id) then raise exception 'not found'; end if;
  if action = 'approve' then
    if t.status <> 'review' then raise exception 'not in review'; end if;
    update public.todos set status = 'done', done_at = now(), updated_at = now() where id = todo;
    insert into public.activity (project_id, body, actor_name) values (t.project_id, t.ref || ' signed off: “' || left(t.title, 80) || '”', public.my_name());
  elsif action = 'reopen' then
    if t.status not in ('review', 'done') then raise exception 'not reviewable'; end if;
    if length(trim(coalesce(note, ''))) < 3 then raise exception 'say what needs changing'; end if;
    update public.todos set status = 'progress', done_at = null, updated_at = now() where id = todo;
    insert into public.todo_comments (todo_id, project_id, author_id, author_name, from_client, body)
    values (todo, t.project_id, auth.uid(), '', true, trim(note));
    insert into public.activity (project_id, body, actor_name) values (t.project_id, t.ref || ' sent back: “' || left(t.title, 80) || '”', public.my_name());
  elsif action = 'withdraw' then
    if t.status <> 'open' or t.created_by is distinct from auth.uid() then raise exception 'can''t withdraw'; end if;
    if exists (select 1 from public.time_entries e where e.todo_id = todo) then raise exception 'time already logged'; end if;
    delete from public.todos where id = todo;
  else
    raise exception 'unknown action';
  end if;
end $$;
revoke execute on function public.add_todo(uuid, text, text, text, date), public.todo_action(uuid, text, text) from public, anon;
grant execute on function public.add_todo(uuid, text, text, text, date), public.todo_action(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Studio email alerts, as for chat (see 20261105000200): a client's new to-do
-- or comment pings embed.design with just the id; the server re-reads it.
-- ---------------------------------------------------------------------------
create or replace function public.ping_studio_on_client_todo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.from_client then
    perform net.http_post(
      url := 'https://embed.design/api/clientapp/hooks/todo',
      body := jsonb_build_object(case when tg_table_name = 'todos' then 'todo' else 'comment' end, new.id),
      headers := '{"content-type": "application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );
  end if;
  return new;
end $$;
revoke execute on function public.ping_studio_on_client_todo() from public, anon, authenticated;
create trigger todos_ping_studio after insert on public.todos for each row execute function public.ping_studio_on_client_todo();
create trigger todo_comments_ping_studio after insert on public.todo_comments for each row execute function public.ping_studio_on_client_todo();

alter publication supabase_realtime add table public.todos, public.todo_comments, public.time_entries;
