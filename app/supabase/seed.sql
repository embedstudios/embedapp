-- Demo data mirroring the design prototype: Priya Raman (VP Product, Nimai Wealth)
-- with three projects, invited as hello@embed.design for testing. Invite that
-- email from the Supabase dashboard (Auth → Invite user) to sign in.
-- Relative dates keep the demo current whenever it is seeded.

insert into public.projects (id, name, subtitle, status, current_phase, progress, phase_summary, start_on, due_on, contract_inr, lead_name) values
  ('00000000-0000-4000-a000-000000000001', 'Nimai Wealth', 'Mobile app redesign', 'active', 'design', 62, '2 deliverables waiting on your review', current_date - 70, current_date + 45, 1920000, 'Arnav'),
  ('00000000-0000-4000-a000-000000000002', 'Korklub', 'Shopify storefront', 'active', 'strategy', 28, 'On track', current_date - 14, current_date + 94, 840000, 'Arnav'),
  ('00000000-0000-4000-a000-000000000003', 'BThere', 'Design system', 'active', 'handover', 91, 'On track', current_date - 88, current_date + 10, 1100000, 'Arnav');

insert into public.project_invites (email, project_id, role, full_name, title)
select 'hello@embed.design', id, 'client', 'Priya Raman', 'VP Product' from public.projects;

insert into public.phases (project_id, key, now_label, blurb)
select p.id, v.key::public.phase_key, v.now_label, v.blurb
from public.projects p cross join (values
  ('research', 'wrapped', 'We learned who your users are and where the current product fails them. Everything downstream is anchored to these findings.'),
  ('strategy', 'wrapped', 'The experience map, sitemap and user journeys that define what we are building and why.'),
  ('ideation', 'wrapped', 'Concepts and low-fidelity wireframes, tested with your team before any pixels were polished.'),
  ('design', 'hi-fi wireframing', 'Hi-fidelity screens, an interactive prototype and the design system your engineers will build from.'),
  ('handover', 'upcoming', 'Documented handover, design QA on builds, Jira moduling and post-launch UI enhancements.')
) as v(key, now_label, blurb);
update public.phases set now_label = 'experience mapping' where project_id = '00000000-0000-4000-a000-000000000002' and key = 'strategy';
update public.phases set now_label = 'design QA' where project_id = '00000000-0000-4000-a000-000000000003' and key = 'handover';

insert into public.team_members (project_id, name, role, position)
select p.id, v.name, v.role, v.pos from public.projects p cross join (values
  ('Arnav', 'Project lead', 0), ('Anushka', 'UI designer', 1), ('Yash', 'Front-end', 2)
) as v(name, role, pos);

-- Approvals (Nimai)
insert into public.approvals (id, project_id, phase, title, kind, meta, note, owner_name, due_on, status, decided_at) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'design', 'Portfolio dashboard — hi-fi v2', 'Hi-fi screens', '14 screens',
   'Second pass on the dashboard after your note on information density. Holdings now lead; performance moved under a tab. Approving unlocks the Transactions screens.', 'Anushka', current_date + 2, 'pending', null),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'design', 'Colour & type foundations', 'Design system', 'tokens',
   'The token set the whole UI will inherit: 2 brand colours, 5 greys, a 7-step type scale. Low risk to approve now; easy to retune later.', 'Arnav', current_date + 5, 'pending', null),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000001', 'design', 'Onboarding flow v3', 'Hi-fi screens', '9 screens',
   'KYC reduced from 6 to 4 steps; progressive disclosure for PAN details.', 'Anushka', null, 'approved', now() - interval '7 days'),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000001', 'strategy', 'User journey map', 'Strategy', '3 journeys',
   'First-investment, SIP top-up and withdrawal journeys with pain points ranked.', 'Arnav', null, 'approved', now() - interval '26 days');

-- Deliverables: Nimai's Design phase is tracked item by item; everything else is derived from the phase.
insert into public.deliverables (project_id, phase, name, status, note, approval_id, position) values
  ('00000000-0000-4000-a000-000000000001', 'design', 'Hi-fi wireframing', 'review', '14 of 22 screens · dashboard in review', '00000000-0000-4000-b000-000000000001', 0),
  ('00000000-0000-4000-a000-000000000001', 'design', 'Prototyping', 'progress', 'v0.9 shared · v1 after dashboard sign-off', null, 1),
  ('00000000-0000-4000-a000-000000000001', 'design', 'Responsive design', 'upcoming', 'Tablet breakpoints · starts in 2 weeks', null, 2),
  ('00000000-0000-4000-a000-000000000001', 'design', 'Design system', 'progress', 'Tokens & 31 components documented', null, 3);

insert into public.deliverables (project_id, phase, name, status, note, position)
select p.id, v.phase::public.phase_key, v.name,
  case when v.phase::public.phase_key < p.current_phase then 'done' when v.phase::public.phase_key = p.current_phase then 'progress' else 'upcoming' end,
  case when v.phase::public.phase_key < p.current_phase then 'Delivered' when v.phase::public.phase_key = p.current_phase then 'In progress' else 'Not started' end,
  v.pos
from public.projects p cross join (values
  ('research', 'Product research', 0), ('research', 'Stakeholder interviews', 1), ('research', 'UX audit', 2), ('research', 'Benchmarking', 3),
  ('strategy', 'Experience mapping', 0), ('strategy', 'Sitemapping', 1), ('strategy', 'User flow & journey', 2),
  ('ideation', 'Concept sketching', 0), ('ideation', 'Low-fi wireframing', 1), ('ideation', 'Design feedback', 2),
  ('design', 'Hi-fi wireframing', 0), ('design', 'Prototyping', 1), ('design', 'Responsive design', 2), ('design', 'Design system', 3),
  ('handover', 'Design handover', 0), ('handover', 'Design testing', 1), ('handover', 'Jira moduling', 2), ('handover', 'UI enhancements', 3)
) as v(phase, name, pos)
where not (p.id = '00000000-0000-4000-a000-000000000001' and v.phase = 'design');

insert into public.project_files (project_id, phase, name, ext, meta, position)
select p.id, v.phase::public.phase_key, v.name, v.ext, v.meta, v.pos
from public.projects p cross join (values
  ('research', 'UX audit — v1.pdf', 'PDF', '42 pages · 14 Aug', 0), ('research', 'Benchmarking board', 'FIG', 'FigJam · 9 Aug', 1),
  ('strategy', 'Experience map', 'FIG', 'FigJam · 2 Sep', 0), ('strategy', 'Sitemap v3.pdf', 'PDF', '6 pages · 8 Sep', 1),
  ('ideation', 'Low-fi wireframes v2', 'FIG', 'Figma · 1 Oct', 0),
  ('design', 'Hi-fi v2', 'FIG', 'Figma · updated today', 0), ('design', 'Prototype v0.9', 'FIG', 'Figma · 24 Oct', 1)
) as v(phase, name, ext, meta, pos)
where v.phase::public.phase_key <= p.current_phase;

-- Scope requests + quote lines (Nimai)
insert into public.scope_requests (id, project_id, ref, title, summary, status, types, description, priority, timing, price_inr, timeline, new_due_on, valid_until, quote_note, accepted_at, created_at) values
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000001', 'SCR-02', 'Dark mode across the app', 'Theme tokens, 12 hi-fi screens re-cut, prototype update.', 'quoted',
   '{New screens,Design system}', 'Dark mode across the app. Theme tokens, 12 hi-fi screens re-cut, prototype update.', 'Normal', 'Next phase',
   240000, '+9 working days', current_date + 56, current_date + 8,
   'Sized tight because the token work is already half done in the design system. If you want it later, the price holds for 7 days.', null, now() - interval '1 day'),
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000001', 'SCR-01', 'Referral screen', 'Invite flow and rewards ledger.', 'accepted',
   '{New feature}', 'Referral screen. Invite flow and rewards ledger.', 'Normal', 'As soon as possible',
   95000, '+4 working days', current_date + 45, null, 'Accepted; in Design.', now() - interval '19 days', now() - interval '22 days');

insert into public.quote_lines (request_id, name, qty, amount_inr, position) values
  ('00000000-0000-4000-c000-000000000002', 'Dark token set', '1 set · 2 days', 50000, 0),
  ('00000000-0000-4000-c000-000000000002', 'Hi-fi screens, dark', '12 screens', 120000, 1),
  ('00000000-0000-4000-c000-000000000002', 'Prototype update', 'v1 → v1.1', 40000, 2),
  ('00000000-0000-4000-c000-000000000002', 'QA & contrast audit', '1 day', 30000, 3),
  ('00000000-0000-4000-c000-000000000001', 'Hi-fi screens', '4 screens', 60000, 0),
  ('00000000-0000-4000-c000-000000000001', 'Prototype update', '', 35000, 1);

insert into public.invoices (project_id, request_id, ref, title, amount_inr, status, due_on, paid_on) values
  ('00000000-0000-4000-a000-000000000001', null, 'INV-0151', 'Milestone 2 — Strategy & Ideation', 480000, 'due', current_date + 18, null),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c000-000000000001', 'INV-0149', 'Scope: Referral screen (50%)', 47500, 'paid', null, current_date - 17),
  ('00000000-0000-4000-a000-000000000001', null, 'INV-0142', 'Milestone 1 — Research', 480000, 'paid', null, current_date - 27);

-- Chat + activity (Nimai)
insert into public.messages (project_id, author_name, from_client, body, created_at) values
  ('00000000-0000-4000-a000-000000000001', 'Anushka', false, 'Hi Priya — dashboard v2 is up for review. Main change: holdings first, performance under a tab, as discussed.', now() - interval '2 days 3 hours'),
  ('00000000-0000-4000-a000-000000000001', 'Priya Raman', true, 'Thanks. Will go through it tonight. Any chance the dark-mode quote lands this week?', now() - interval '1 day 22 hours'),
  ('00000000-0000-4000-a000-000000000001', 'Arnav', false, 'Posted it under Scope just now — ₹2.4L, +9 days. Happy to walk you through it.', now() - interval '1 day 2 hours');

insert into public.activity (project_id, body, actor_name, created_at) values
  ('00000000-0000-4000-a000-000000000001', 'Quote posted for “Dark mode across the app”', 'Arnav', now() - interval '1 day'),
  ('00000000-0000-4000-a000-000000000001', 'Portfolio dashboard v2 sent for your review', 'Anushka', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000001', 'Design tokens documented — 31 components', 'Yash', now() - interval '3 days'),
  ('00000000-0000-4000-a000-000000000001', 'Onboarding v3 approved — Transactions screens started', 'Priya Raman', now() - interval '6 days');
