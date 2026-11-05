-- Drop the "·" separator from generated text: scope summaries now read
-- "New screens, Normal, Flexible". Existing seed text is rewritten the same way.
create or replace function public.submit_scope_request(project uuid, types text[], description text, goal text, priority text, timing text)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare n int; rid uuid; t text;
begin
  if not public.is_member(project) then raise exception 'not found'; end if;
  if coalesce(array_length(types, 1), 0) = 0 or length(trim(description)) < 10 then raise exception 'brief incomplete'; end if;
  select count(*) + 1 into n from public.scope_requests where project_id = project;
  t := left(split_part(split_part(trim(description), '.', 1), E'\n', 1), 48);
  insert into public.scope_requests (project_id, ref, title, summary, types, description, goal, priority, timing, created_by)
  values (project, 'SCR-' || lpad(n::text, 2, '0'), t,
          array_to_string(types, ', ') || ', ' || priority || ', ' || coalesce(nullif(timing, ''), 'Flexible'),
          types, trim(description), nullif(trim(goal), ''), priority, coalesce(nullif(timing, ''), 'Flexible'), auth.uid())
  returning id into rid;
  insert into public.activity (project_id, body, actor_name) values (project, 'Scope brief sent: “' || t || '”', public.my_name());
  return rid;
end $function$;

update public.deliverables set note = replace(note, ' · ', ', ') where note like '% · %';
update public.project_files set meta = replace(meta, ' · ', ', ') where meta like '% · %';
update public.quote_lines set qty = replace(qty, ' · ', ', ') where qty like '% · %';
update public.scope_requests set summary = replace(summary, ' · ', ', ') where summary like '% · %';
