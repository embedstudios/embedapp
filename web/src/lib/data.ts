// Reads and writes for the signed-in client, straight against Supabase with
// row-level security, using the same RPCs as the mobile app.
import { supabase } from './supabase';

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped field by field */

export const PHASES = ['research', 'strategy', 'ideation', 'design', 'handover'] as const;
export type PhaseKey = (typeof PHASES)[number];
/* Display names only; the keys are the contract with the admin portal and the database. */
export const PHASE_NAMES: Record<PhaseKey, string> = { research: 'Discover', strategy: 'Define', ideation: 'Design', design: 'Develop', handover: 'Handoff' };

export type Profile = { id: string; email: string; fullName: string; title: string; currency: 'INR' | 'USD'; notify: boolean };
export type Project = {
  id: string; name: string; subtitle: string; status: 'proposal' | 'active' | 'complete'; currentPhase: PhaseKey; progress: number;
  phaseSummary: string; startOn: string | null; dueOn: string | null; contractInr: number | null; leadName: string;
  budgetLabel: string | null; timing: string | null; subdomain: string | null; services: string[]; brief: string;
};
export type Phase = { key: PhaseKey; nowLabel: string; blurb: string };
export type Deliverable = { id: string; phase: PhaseKey; name: string; status: 'done' | 'review' | 'progress' | 'upcoming'; note: string; approvalId: string | null };
export type ProjectFile = { id: string; phase: PhaseKey; name: string; ext: string; meta: string; url: string | null };
export type TeamMember = { id: string; name: string; role: string };
export type Approval = {
  id: string; phase: PhaseKey; title: string; kind: string; meta: string; note: string; ownerName: string; dueOn: string | null;
  status: 'pending' | 'approved' | 'changes'; feedback: string | null; decidedAt: string | null; previewUrl: string | null; figmaUrl: string | null;
  /** Preview of figmaUrl (any link), read by the admin when the approval was saved. */
  link: { title: string; description: string; site: string; image: string } | null;
};
export type QuoteLine = { name: string; qty: string; amountInr: number };
export type ScopeRequest = {
  id: string; ref: string; title: string; summary: string; status: 'reviewing' | 'quoted' | 'accepted' | 'declined';
  description: string; goal: string | null; priority: string; timing: string; types: string[];
  priceInr: number | null; timeline: string | null; newDueOn: string | null; validUntil: string | null; quoteNote: string | null;
  acceptedAt: string | null; createdAt: string; lines: QuoteLine[];
};
export type Invoice = { id: string; ref: string; title: string; amountInr: number; amount: number | null; currency: string; status: 'scheduled' | 'due' | 'paid'; dueOn: string | null; paidOn: string | null; paymentUrl: string | null; requestId: string | null };
export type Activity = { id: string; body: string; actorName: string; createdAt: string };
export type Message = { id: string; authorId: string | null; authorName: string; fromClient: boolean; body: string; createdAt: string };
export type Detail = {
  project: Project; phases: Phase[]; deliverables: Deliverable[]; files: ProjectFile[]; team: TeamMember[];
  approvals: Approval[]; requests: ScopeRequest[]; invoices: Invoice[]; activity: Activity[];
};

const n = (v: any) => (v == null ? null : Number(v));
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export const toProject = (r: any): Project => ({
  id: r.id, name: r.name, subtitle: r.subtitle, status: r.status, currentPhase: r.current_phase, progress: r.progress,
  phaseSummary: r.phase_summary, startOn: r.start_on, dueOn: r.due_on, contractInr: n(r.contract_inr), leadName: r.lead_name,
  budgetLabel: r.budget_label, timing: r.timing, subdomain: r.subdomain, services: r.services || [], brief: r.brief || '',
});
export const toMessage = (r: any): Message => ({ id: r.id, authorId: r.author_id, authorName: r.author_name, fromClient: r.from_client, body: r.body, createdAt: r.created_at });

/** The brand name for a subdomain, for the sign-in page (no sign-in needed). */
export async function brandCard(sub: string) {
  const rows = check(await supabase.rpc('brand_card', { sub })) as { name: string; subtitle: string }[] | null;
  return rows && rows[0] ? rows[0] : null;
}

export async function loadProfile(): Promise<Profile> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('Not signed in');
  const r: any = check(await supabase.from('profiles').select('*').eq('id', u.user.id).single());
  return { id: r.id, email: u.user.email ?? '', fullName: r.full_name, title: r.title, currency: r.currency, notify: r.notify };
}
export async function updateProfile(patch: Partial<Pick<Profile, 'currency' | 'notify' | 'fullName' | 'title'>>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const row: any = {};
  if (patch.currency) row.currency = patch.currency;
  if (patch.notify !== undefined) row.notify = patch.notify;
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.title !== undefined) row.title = patch.title;
  check(await supabase.from('profiles').update(row).eq('id', u.user.id));
}

export async function listProjects(): Promise<Project[]> {
  return (check(await supabase.from('projects').select('*').order('created_at')) as any[]).map(toProject);
}

export async function loadDetail(projectId: string): Promise<Detail> {
  const q = <T,>(p: PromiseLike<{ data: T; error: any }>) => p.then(check);
  const [project, phases, deliverables, files, team, approvals, requests, invoices, activity] = await Promise.all([
    q(supabase.from('projects').select('*').eq('id', projectId).single()),
    q(supabase.from('phases').select('*').eq('project_id', projectId)),
    q(supabase.from('deliverables').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('project_files').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('team_members').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('approvals').select('*').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('scope_requests').select('*, quote_lines(*)').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('activity').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(12)),
  ]) as any[];
  return {
    project: toProject(project),
    phases: PHASES.map(k => { const p = phases.find((x: any) => x.key === k) || {}; return { key: k, nowLabel: p.now_label || '', blurb: p.blurb || '' }; }),
    deliverables: deliverables.map((r: any) => ({ id: r.id, phase: r.phase, name: r.name, status: r.status, note: r.note, approvalId: r.approval_id })),
    files: files.map((r: any) => ({ id: r.id, phase: r.phase, name: r.name, ext: r.ext, meta: r.meta, url: r.url })),
    team: team.map((r: any) => ({ id: r.id, name: r.name, role: r.role })),
    approvals: approvals.map((r: any) => ({
      id: r.id, phase: r.phase, title: r.title, kind: r.kind, meta: r.meta, note: r.note, ownerName: r.owner_name, dueOn: r.due_on,
      status: r.status, feedback: r.feedback, decidedAt: r.decided_at, previewUrl: r.preview_url, figmaUrl: r.figma_url,
      link: r.figma_url ? { title: r.link_title || '', description: r.link_description || '', site: r.link_site || '', image: r.link_image || '' } : null,
    })),
    requests: requests.map((r: any) => ({
      id: r.id, ref: r.ref, title: r.title, summary: r.summary, status: r.status, description: r.description, goal: r.goal,
      priority: r.priority, timing: r.timing, types: r.types || [], priceInr: n(r.price_inr), timeline: r.timeline, newDueOn: r.new_due_on,
      validUntil: r.valid_until, quoteNote: r.quote_note, acceptedAt: r.accepted_at, createdAt: r.created_at,
      lines: [...(r.quote_lines || [])].sort((a: any, b: any) => a.position - b.position).map((l: any) => ({ name: l.name, qty: l.qty, amountInr: Number(l.amount_inr) })),
    })),
    invoices: invoices.map((r: any) => ({
      id: r.id, ref: r.ref, title: r.title, amountInr: Number(r.amount_inr), amount: n(r.amount), currency: r.currency || 'INR',
      status: r.status, dueOn: r.due_on, paidOn: r.paid_on, paymentUrl: r.payment_url, requestId: r.request_id,
    })),
    activity: activity.map((r: any) => ({ id: r.id, body: r.body, actorName: r.actor_name, createdAt: r.created_at })),
  };
}

export async function listMessages(projectId: string): Promise<Message[]> {
  return (check(await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at')) as any[]).map(toMessage);
}
export async function sendMessage(projectId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  // author_name and from_client are set server-side by the stamp_message trigger.
  check(await supabase.from('messages').insert({ project_id: projectId, author_id: u.user?.id, author_name: '', from_client: true, body }));
}
export function subscribeMessages(projectId: string, onMessage: (m: Message) => void, tag = 'page') {
  const ch = supabase
    .channel('web-messages:' + tag + ':' + projectId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'project_id=eq.' + projectId }, p => onMessage(toMessage(p.new)))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

const rpc = async (fn: string, args: Record<string, unknown>) => check(await supabase.rpc(fn, args));
export const approve = (id: string) => rpc('approve', { approval: id });
export const undoApproval = (id: string) => rpc('undo_approval', { approval: id });
export const requestChanges = (id: string, feedback: string) => rpc('request_changes', { approval: id, feedback });
export const acceptQuote = (id: string) => rpc('accept_quote', { request: id });
export const undoAcceptQuote = (id: string) => rpc('undo_accept_quote', { request: id });
export const submitScopeRequest = (projectId: string, b: { types: string[]; description: string; goal: string; priority: string; timing: string }) =>
  rpc('submit_scope_request', { project: projectId, types: b.types, description: b.description, goal: b.goal, priority: b.priority, timing: b.timing });
export const submitProjectBrief = (b: { name: string; services: string[]; brief: string; goal: string; budgetLabel: string; timing: string }) =>
  rpc('submit_project_brief', { name: b.name, services: b.services, brief: b.brief, goal: b.goal, budget_label: b.budgetLabel, timing: b.timing });
