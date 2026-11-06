import type { SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import type { Api, Message, Profile, Project, ProjectDetail } from './types';

const num = (v: any) => (v == null ? null : Number(v));

const toProject = (r: any): Project => ({
  id: r.id, name: r.name, subtitle: r.subtitle, status: r.status, currentPhase: r.current_phase, progress: r.progress,
  phaseSummary: r.phase_summary, startOn: r.start_on, dueOn: r.due_on, contractInr: num(r.contract_inr),
  leadName: r.lead_name, budgetLabel: r.budget_label, timing: r.timing,
});

const toMessage = (r: any): Message => ({
  id: r.id, authorId: r.author_id, authorName: r.author_name, fromClient: r.from_client, body: r.body, createdAt: r.created_at,
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function createSupabaseApi(sb: SupabaseClient): Api {
  const rpc = async (fn: string, args: Record<string, unknown>) => check(await sb.rpc(fn, args));

  return {
    mode: 'live',

    async getSessionEmail() {
      const { data } = await sb.auth.getSession();
      return data.session?.user.email ?? null;
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session?.user.email ?? null));
      return () => data.subscription.unsubscribe();
    },
    async sendMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({
        email,
        // Invite-only: unknown emails are rejected instead of creating accounts.
        options: { shouldCreateUser: false, emailRedirectTo: Linking.createURL('auth-callback') },
      });
      if (error) throw new Error(error.message);
    },
    async verifyCode(email, code) {
      const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw new Error(error.message);
    },
    async completeSignInFromUrl(url) {
      const parsed = new URL(url.replace('#', url.includes('?') ? '&' : '?'));
      const p = parsed.searchParams;
      const err = p.get('error_description');
      if (err) throw new Error(err);
      const code = p.get('code');
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) throw new Error(error.message);
        return true;
      }
      const access_token = p.get('access_token'), refresh_token = p.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await sb.auth.setSession({ access_token, refresh_token });
        if (error) throw new Error(error.message);
        return true;
      }
      return false;
    },
    async signOut() {
      await sb.auth.signOut();
    },

    async loadProfile(): Promise<Profile> {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new Error('Not signed in');
      const r: any = check(await sb.from('profiles').select('*').eq('id', u.user.id).single());
      return { id: r.id, email: u.user.email ?? '', fullName: r.full_name, title: r.title, currency: r.currency, notify: r.notify };
    },
    async updateProfile(patch) {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      check(await sb.from('profiles').update(patch).eq('id', u.user.id));
    },
    async listProjects() {
      const rows: any[] = check(await sb.from('projects').select('*').order('created_at')) ?? [];
      return rows.map(toProject);
    },
    async loadProject(id): Promise<ProjectDetail> {
      const [project, phases, deliverables, files, team, approvals, requests, invoices, activity] = await Promise.all([
        sb.from('projects').select('*').eq('id', id).single(),
        sb.from('phases').select('*').eq('project_id', id),
        sb.from('deliverables').select('*').eq('project_id', id).order('position'),
        sb.from('project_files').select('*').eq('project_id', id).order('position'),
        sb.from('team_members').select('*').eq('project_id', id).order('position'),
        sb.from('approvals').select('*').eq('project_id', id).order('created_at'),
        sb.from('scope_requests').select('*, quote_lines(*)').eq('project_id', id).order('created_at', { ascending: false }),
        sb.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        sb.from('activity').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(6),
      ]).then(all => all.map(check as (r: any) => any));
      return {
        project: toProject(project),
        phases: phases.map((r: any) => ({ key: r.key, nowLabel: r.now_label, blurb: r.blurb })),
        deliverables: deliverables.map((r: any) => ({ id: r.id, phase: r.phase, name: r.name, status: r.status, note: r.note, approvalId: r.approval_id })),
        files: files.map((r: any) => ({ id: r.id, phase: r.phase, name: r.name, ext: r.ext, meta: r.meta, url: r.url })),
        team: team.map((r: any) => ({ id: r.id, name: r.name, role: r.role })),
        approvals: approvals.map((r: any) => ({
          id: r.id, phase: r.phase, title: r.title, kind: r.kind, meta: r.meta, note: r.note, ownerName: r.owner_name,
          dueOn: r.due_on, status: r.status, decidedAt: r.decided_at, previewUrl: r.preview_url, figmaUrl: r.figma_url,
        })),
        requests: requests.map((r: any) => ({
          id: r.id, ref: r.ref, title: r.title, summary: r.summary, status: r.status, priceInr: num(r.price_inr), timeline: r.timeline,
          newDueOn: r.new_due_on, validUntil: r.valid_until, quoteNote: r.quote_note,
          lines: [...(r.quote_lines ?? [])].sort((a: any, b: any) => a.position - b.position)
            .map((l: any) => ({ id: l.id, name: l.name, qty: l.qty, amountInr: Number(l.amount_inr) })),
        })),
        invoices: invoices.map((r: any) => ({
          id: r.id, ref: r.ref, title: r.title, amountInr: Number(r.amount_inr), status: r.status, dueOn: r.due_on, paidOn: r.paid_on,
          paymentUrl: r.payment_url, receiptUrl: r.receipt_url,
        })),
        activity: activity.map((r: any) => ({ id: r.id, body: r.body, actorName: r.actor_name, createdAt: r.created_at })),
      };
    },

    async listMessages(projectId) {
      const rows: any[] = check(await sb.from('messages').select('*').eq('project_id', projectId).order('created_at')) ?? [];
      return rows.map(toMessage);
    },
    async sendMessage(projectId, body) {
      const { data: u } = await sb.auth.getUser();
      // author_name and from_client are overwritten server-side by the stamp_message trigger.
      check(await sb.from('messages').insert({ project_id: projectId, author_id: u.user?.id, author_name: '', from_client: true, body }));
    },
    subscribeMessages(projectId, { onMessage }) {
      const channel = sb
        .channel('messages:' + projectId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'project_id=eq.' + projectId },
          payload => onMessage(toMessage(payload.new)))
        .subscribe();
      return () => { sb.removeChannel(channel); };
    },

    approve: async id => { await rpc('approve', { approval: id }); },
    undoApproval: async id => { await rpc('undo_approval', { approval: id }); },
    requestChanges: async (id, feedback) => { await rpc('request_changes', { approval: id, feedback }); },
    submitScopeRequest: async (projectId, b) =>
      (await rpc('submit_scope_request', { project: projectId, types: b.types, description: b.description, goal: b.goal, priority: b.priority, timing: b.timing })) as string,
    acceptQuote: async id => { await rpc('accept_quote', { request: id }); },
    undoAcceptQuote: async id => { await rpc('undo_accept_quote', { request: id }); },
    submitProjectBrief: async b =>
      (await rpc('submit_project_brief', { name: b.name, services: b.services, brief: b.brief, goal: b.goal, budget_label: b.budgetLabel, timing: b.timing })) as string,
  };
}
