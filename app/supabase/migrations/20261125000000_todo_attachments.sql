-- Files on to-do comments. A comment carries `attachments`, a list of
-- {path, name, mime, size}; the files themselves sit in the private Storage
-- bucket `todo-files` at <project_id>/<todo_id>/<random>-<name>. Members of the
-- project can add and read them (the first folder is the project id); the
-- studio's admin reads and writes with the service key and only signs paths
-- under the comment's own project. Nobody but the service key changes or
-- deletes a file. A comment may now be files alone, with no text.
alter table public.todo_comments add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.todo_comments drop constraint if exists todo_comments_body_check;
alter table public.todo_comments add constraint todo_comments_body_check
  check (length(trim(body)) > 0 or jsonb_array_length(attachments) > 0);
alter table public.todo_comments drop constraint if exists todo_comments_attachments_check;
alter table public.todo_comments add constraint todo_comments_attachments_check
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 8);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('todo-files', 'todo-files', false, 15728640, array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv', 'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- The first folder of an object's name is the project id. Anything that isn't
-- a uuid there is simply not a member's file.
create or replace function public.todo_file_project(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid end;
$$;

drop policy if exists "members read todo files" on storage.objects;
create policy "members read todo files" on storage.objects for select to authenticated
  using (bucket_id = 'todo-files' and public.is_member(public.todo_file_project(name)));
drop policy if exists "members add todo files" on storage.objects;
create policy "members add todo files" on storage.objects for insert to authenticated
  with check (bucket_id = 'todo-files' and public.is_member(public.todo_file_project(name)));
