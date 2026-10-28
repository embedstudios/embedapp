# Embed — client app

Expo (SDK 58) + Expo Router app for Embed Studios clients. Clients use it to track a project
through Research → Strategy → Ideation → Design → Handover, approve deliverables, brief scope
changes, accept fixed-price quotes, see billing and chat with the studio. It implements the Claude
Design handoff in `../project/Embed Client App.dc.html` (light theme, `#0E7A45` accent, Space
Grotesk / Inter / DM Mono, the `<tag>` voice and its micro-interactions).

## Run

```bash
npm install
npx expo start          # i / a for simulators, w for web
npm run typecheck && npm run lint
```

With no Supabase env vars the app runs in **demo mode**: in-memory data mirroring the prototype
(Priya Raman, Nimai Wealth, three projects). Any email signs you in.

## Connect Supabase

1. Apply `supabase/migrations/20261028000000_client_app.sql`, then `supabase/seed.sql` for demo data
   (`supabase db push`, or paste both into the SQL editor).
2. The seed invites `hello@embed.design` (as Priya Raman) to all three demo projects. Invite that
   email under Auth → Users → Invite user. Sign-in is invite-only (`shouldCreateUser: false`).
3. Auth → URL Configuration → Redirect URLs: add `embed://auth-callback` (plus
   `exp://**` for Expo Go and `http://localhost:8081/auth-callback` for web).
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.

### Data model

- Clients read everything on projects they're members of (RLS via `is_member`). They write only
  their own profile and chat messages, and act through RPCs: `approve`, `undo_approval`,
  `request_changes`, `submit_scope_request`, `accept_quote`, `undo_accept_quote`,
  `submit_project_brief`. Undo is allowed for 2 minutes.
- Studio members (`project_members.role = 'studio'`) have full write access on their projects, for
  posting quotes, invoices, files and phase progress (there is no studio UI yet).
- `project_invites` turns into memberships when the invited user is created (`handle_new_user`).
- Chat is live through Supabase Realtime on `messages`.

## Layout

```
src/app/            routes: sign-in, auth-callback, (app)/ index (Home), approvals, approval/[id],
                    scope, quote/[id], brief (?mode=scope|project), phase/[key], invoices, chat, more
src/components/     DS primitives (Txt, Button, Icon, Mark, Press…), motion, sheets, toast, marquee
src/data/           Api interface + Supabase and demo implementations
src/state/          session, store (profile, projects, current project), view helpers
src/assets/         client logos (monochrome SVG strings, generated from ../project/assets/logos)
```

## Not built yet

- Payments: "Pay now" opens `invoices.payment_url` when the studio sets one; there's no in-app checkout.
- Attachments in chat and briefs, Figma previews (`approvals.preview_url` / `figma_url` are wired but empty in the seed).
- Push notifications for the "Notify me" preference (the setting is stored on the profile).
