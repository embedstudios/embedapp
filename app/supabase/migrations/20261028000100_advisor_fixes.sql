-- Follow-ups from the Supabase security / performance advisors.

-- Pin search_path on the remaining helper.
alter function public.undo_window() set search_path = '';

-- Trigger functions are not API endpoints.
revoke execute on function public.handle_new_user(), public.stamp_message() from authenticated, anon, public;

-- "studio writes" was FOR ALL, so every SELECT evaluated two permissive policies.
-- Split it into insert / update / delete; reads stay on "members read".
do $$
declare t text;
begin
  foreach t in array array['team_members', 'phases', 'approvals', 'deliverables', 'project_files', 'scope_requests', 'invoices', 'activity'] loop
    execute format('drop policy "studio writes" on public.%I', t);
    execute format('create policy "studio inserts" on public.%I for insert to authenticated with check (public.is_studio(project_id))', t);
    execute format('create policy "studio updates" on public.%I for update to authenticated using (public.is_studio(project_id)) with check (public.is_studio(project_id))', t);
    execute format('create policy "studio deletes" on public.%I for delete to authenticated using (public.is_studio(project_id))', t);
  end loop;
end $$;

drop policy "studio writes" on public.quote_lines;
create policy "studio inserts" on public.quote_lines for insert to authenticated
  with check (exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)));
create policy "studio updates" on public.quote_lines for update to authenticated
  using (exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)))
  with check (exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)));
create policy "studio deletes" on public.quote_lines for delete to authenticated
  using (exists (select 1 from public.scope_requests r where r.id = request_id and public.is_studio(r.project_id)));

-- Cover the remaining foreign keys.
create index on public.approvals (decided_by);
create index on public.deliverables (approval_id);
create index on public.invoices (request_id);
create index on public.messages (author_id);
create index on public.project_invites (project_id);
create index on public.projects (created_by);
create index on public.scope_requests (created_by);
