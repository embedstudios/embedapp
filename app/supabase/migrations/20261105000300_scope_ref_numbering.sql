-- Scope refs are unique per project. Number a client's new brief after the
-- highest existing SCR-NN rather than the row count, so it can't collide with
-- scope the studio added from the admin or with gaps left by deletions.
create or replace function public.submit_scope_request(project uuid, types text[], description text, goal text, priority text, timing text)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare n int; rid uuid; t text;
begin
  if not public.is_member(project) then raise exception 'not found'; end if;
  if coalesce(array_length(types, 1), 0) = 0 or length(trim(description)) < 10 then raise exception 'brief incomplete'; end if;
  select coalesce(max(nullif(substring(ref from '(\d+)$'), '')::int), 0) + 1 into n from public.scope_requests where project_id = project;
  t := left(split_part(split_part(trim(description), '.', 1), E'\n', 1), 48);
  insert into public.scope_requests (project_id, ref, title, summary, types, description, goal, priority, timing, created_by)
  values (project, 'SCR-' || lpad(n::text, 2, '0'), t,
          array_to_string(types, ', ') || ', ' || priority || ', ' || coalesce(nullif(timing, ''), 'Flexible'),
          types, trim(description), nullif(trim(goal), ''), priority, coalesce(nullif(timing, ''), 'Flexible'), auth.uid())
  returning id into rid;
  insert into public.activity (project_id, body, actor_name) values (project, 'Scope brief sent: “' || t || '”', public.my_name());
  return rid;
end $function$;
