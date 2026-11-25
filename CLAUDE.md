# Embed client app — working notes

The Expo app lives in `app/` (see `app/AGENTS.md` for Expo rules). Its Supabase
schema is `app/supabase/migrations/`.

## The admin portal also writes to this app's data
The studio admin portal at embed.design/admin (repo `embedstudios/embed-design-site`,
branch `main`) manages this app's Supabase project server-side with the secret
(service-role) key. It is the studio's side of the app: briefs, quotes, approvals,
deliverables, files, team, chat replies, client access and invoices.

- Portal code: `api/clientapp.mjs` (the `/api/clientapp/*` routes; every table and
  column it reads or writes) and `clientapp.jsx` (the Client app screens). Its
  `CLAUDE.md` section "Admin portal is shared with the client app" is the other
  half of this note.
- Before changing anything below, read `api/clientapp.mjs` on the portal's
  latest `main`, and change both sides together. A rename here breaks the portal
  silently: PostgREST just returns an error the portal shows as a 424.

### Contract with the portal
- **Tables and columns** the portal reads and writes: `projects`, `phases`,
  `deliverables`, `project_files`, `team_members`, `approvals`, `scope_requests`,
  `quote_lines`, `invoices`, `activity`, `messages`, and for retainers `todos`,
  `todo_comments`, `time_entries`, `projects.engagement` /
  `retainer_hours`. Includes
  `projects.external_ref` (= the portal's `studio_engagements.id`), and
  `invoices.zoho_invoice_id`, `currency`, `amount`, `request_id`, `payment_url`.
- **Keys the portal upserts on:** `projects.external_ref`,
  `invoices.zoho_invoice_id`, the `phases` primary key `(project_id, key)`
  and the `audits` primary key `(project_id, token)`.
- **Audits:** `audits` (written only by the portal's `syncAppAudits()`;
  members read) and `projects.website` (set in the admin). Status values
  `collecting` / `first_look` / `auditing` / `ready` / `delayed`; kind
  `url` / `app` / `screens` / `figma`; `report_url` is the private
  embed.design report link. The web portal's Audits tab reads them; the Expo
  app doesn't yet.
- **Enum and status values:** phase keys `research`, `strategy`, `ideation`,
  `design`, `handover`; project status `proposal` / `active` / `complete`;
  deliverable `done` / `review` / `progress` / `upcoming`; approval
  `pending` / `approved` / `changes`; scope request
  `reviewing` / `quoted` / `accepted` / `declined`; invoice
  `scheduled` / `due` / `paid`.
- **Retainer values:** engagement `project` / `retainer` / `both`; to-do status
  `open` / `progress` / `review` / `done`, priority `normal` / `urgent`; refs
  `TD-n`. Client RPCs `add_todo`, `todo_action(approve|reopen|withdraw)`; the
  pg_net trigger posts `{todo}` or `{comment}` to `/api/clientapp/hooks/todo`.
  The Expo app doesn't show to-dos or the timesheet yet; the web portal does.
- **Files on to-do comments:** `todo_comments.attachments` is a list of
  `{path, name, mime, size}` (8 at most; a comment may be files alone). The
  files sit in the private Storage bucket `todo-files` at
  `<project_id>/<todo_id>/<random>-<name>`, 15 MB each, images, PDF, Office
  files, CSV and text. Members add and read them under RLS (the first folder
  is the project id); the admin signs links and upload links with the secret
  key and only for paths under the comment's own project. The web portal
  shrinks photos in the browser before upload (`shrinkImage`, 2000px WebP).
- **Voice comments (web portal):** the browser's speech recognition turns
  speech into text live (`lib/dictation.ts`); after a pause the portal posts
  the words to the admin server's `POST /api/portal/tidy` with the user's
  Supabase access token, and offers the tidied text to accept or ignore.
  Firefox has no speech recognition, so the microphone button is hidden there.
- **Functions** (service role only): `studio_project_access(project)`,
  `studio_grant_access(project, email, full_name, title, role)`,
  `studio_revoke_access(project, email)`.
- **Behaviour the portal relies on:** a new project brief is a `projects` row
  with status `proposal` whose only member is the person who sent it; a thread is
  waiting on the studio when its newest `messages` row has `from_client = true`;
  an accepted quote's `scheduled` placeholder invoice carries `request_id`, and
  the portal deletes it once a real Zoho invoice covers that quote; granting
  access creates a confirmed auth user, and the sign-up trigger turns the
  pending invite into a membership.

### Working on both
- Both projects now change the same portal. Fetch the portal's latest `main`
  before editing it, and fetch this branch before pushing here.
- Schema changes go in a new migration here first, are applied to Supabase, and
  only then does the portal start using them, so the live portal never queries
  a column that isn't there yet.
