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
  /** 'project' (one-off, phases), 'retainer' (to-dos + timesheet) or 'both'. */
  engagement: 'project' | 'retainer' | 'both'; retainerHours: number | null;
  /** The client's own site, offered for the free first look on the Audits tab. */
  website: string | null;
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
/** A file on a to-do comment: where it sits in the `todo-files` bucket, and what it is. */
export type Attachment = { path: string; name: string; mime: string; size: number };
export type TodoComment = { id: string; authorId: string | null; authorName: string; fromClient: boolean; body: string; createdAt: string; attachments: Attachment[] };
export type Todo = {
  id: string; ref: string; title: string; details: string; status: 'open' | 'progress' | 'review' | 'done'; priority: 'normal' | 'urgent';
  dueOn: string | null; fromClient: boolean; createdBy: string | null; byName: string; doneAt: string | null; createdAt: string; updatedAt: string; comments: TodoComment[];
};
export type TimeEntry = { id: string; todoId: string | null; personName: string; description: string; workOn: string; minutes: number; billable: boolean; running: boolean; startedAt: string | null };
export type Activity = { id: string; body: string; actorName: string; createdAt: string };
/** An audit from embed.design/audit, published to the project by the studio (matched by the buyer's email, or linked by hand). */
export type Audit = {
  token: string; kind: 'url' | 'app' | 'screens' | 'figma'; target: string; name: string;
  status: 'collecting' | 'first_look' | 'auditing' | 'ready' | 'delayed'; paid: boolean; reaudit: boolean;
  overall: number | null; scores: Record<string, number | null>; verdict: string; findings: number | null;
  reportUrl: string; createdAt: string; readyAt: string | null;
};
export type Message = { id: string; authorId: string | null; authorName: string; fromClient: boolean; body: string; createdAt: string };
export type Detail = {
  project: Project; phases: Phase[]; deliverables: Deliverable[]; files: ProjectFile[]; team: TeamMember[];
  approvals: Approval[]; requests: ScopeRequest[]; invoices: Invoice[]; activity: Activity[];
  todos: Todo[]; time: TimeEntry[]; audits: Audit[];
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
  engagement: r.engagement || 'project', retainerHours: n(r.retainer_hours), website: r.website || null,
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
  const [project, phases, deliverables, files, team, approvals, requests, invoices, activity, todos, time, audits] = await Promise.all([
    q(supabase.from('projects').select('*').eq('id', projectId).single()),
    q(supabase.from('phases').select('*').eq('project_id', projectId)),
    q(supabase.from('deliverables').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('project_files').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('team_members').select('*').eq('project_id', projectId).order('position')),
    q(supabase.from('approvals').select('*').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('scope_requests').select('*, quote_lines(*)').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false })),
    q(supabase.from('activity').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(12)),
    q(supabase.from('todos').select('*, todo_comments(*)').eq('project_id', projectId).order('created_at', { ascending: false }).limit(500)),
    q(supabase.from('time_entries').select('*').eq('project_id', projectId).order('work_on', { ascending: false }).order('created_at', { ascending: false }).limit(3000)),
    q(supabase.from('audits').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(100)),
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
    todos: todos.map(toTodo),
    time: time.map((r: any) => ({ id: r.id, todoId: r.todo_id, personName: r.person_name, description: r.description, workOn: r.work_on, minutes: r.minutes, billable: r.billable, running: r.running, startedAt: r.started_at })),
    audits: audits.map((r: any) => ({
      token: r.token, kind: r.kind, target: r.target || '', name: r.name || '', status: r.status, paid: !!r.paid, reaudit: !!r.reaudit,
      overall: n(r.overall), scores: r.scores || {}, verdict: r.verdict || '', findings: n(r.findings), reportUrl: r.report_url, createdAt: r.created_at, readyAt: r.ready_at,
    })),
  };
}

const toComment = (c: any): TodoComment => ({ id: c.id, authorId: c.author_id, authorName: c.author_name, fromClient: c.from_client, body: c.body || '', createdAt: c.created_at, attachments: Array.isArray(c.attachments) ? c.attachments : [] });
const toTodo = (r: any): Todo => ({
  id: r.id, ref: r.ref, title: r.title, details: r.details || '', status: r.status, priority: r.priority, dueOn: r.due_on, fromClient: r.from_client,
  createdBy: r.created_by, byName: r.created_by_name, doneAt: r.done_at, createdAt: r.created_at, updatedAt: r.updated_at,
  comments: [...(r.todo_comments || [])].sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1)).map(toComment),
});

/* Retainer to-dos: the client adds them and signs off; Embed does the rest. */
export const addTodo = async (projectId: string, f: { title: string; details: string; priority: 'normal' | 'urgent'; dueOn: string }) =>
  check(await supabase.rpc('add_todo', { project: projectId, title: f.title, details: f.details, priority: f.priority, due_on: f.dueOn || null })) as string;
export const todoAction = async (todo: string, action: 'approve' | 'reopen' | 'withdraw', note?: string) =>
  check(await supabase.rpc('todo_action', { todo, action, note: note ?? null }));
export async function commentTodo(projectId: string, todoId: string, body: string, attachments: Attachment[] = []) {
  const { data: u } = await supabase.auth.getUser();
  // author_name and from_client are set by the database, as for chat.
  check(await supabase.from('todo_comments').insert({ todo_id: todoId, project_id: projectId, author_id: u.user?.id, author_name: '', from_client: true, body, attachments }));
}

/* ---- files on to-do comments ----------------------------------------------
   Files go to the private `todo-files` bucket at
   <project>/<todo>/<random>-<name>; row-level security lets only the project's
   members add and read them. Photos and screenshots are made smaller in the
   browser first (longest side 2000px, WebP), which usually cuts a phone photo
   from several MB to a few hundred KB; PDFs and documents go up as they are. */
export const TODO_FILE_MAX = 15 * 1024 * 1024;
export const TODO_FILES_PER_COMMENT = 8;
export const TODO_FILE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/csv': 'csv', 'text/plain': 'txt',
};
export const TODO_FILE_ACCEPT = Object.keys(TODO_FILE_TYPES).join(',');
export const isImage = (mime: string) => /^image\/(jpeg|png|webp|gif)$/.test(mime);

/** Shrinks a photo or screenshot; returns the original when that wouldn't help. */
export async function shrinkImage(file: File): Promise<{ blob: Blob; name: string; mime: string }> {
  const keep = { blob: file as Blob, name: file.name, mime: file.type };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return keep;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 400 * 1024) { bmp.close(); return keep; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.82));
    // A browser that can't write WebP hands back a PNG: keep the original then.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return keep;
    return { blob, name: file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', mime: 'image/webp' };
  } catch { return keep; }
}

/** Uploads one file for a to-do and returns what to store on the comment. */
export async function uploadTodoFile(projectId: string, todoId: string, file: File): Promise<Attachment> {
  if (!TODO_FILE_TYPES[file.type]) throw new Error('“' + file.name + '” can’t be attached. Use an image, a PDF, or a Word, Excel, PowerPoint, CSV or text file.');
  const f = await shrinkImage(file);
  if (f.blob.size > TODO_FILE_MAX) throw new Error('“' + file.name + '” is over 15 MB. Share a link to it instead.');
  const safe = f.name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'file';
  const path = projectId + '/' + todoId + '/' + crypto.randomUUID() + '-' + safe;
  const { error } = await supabase.storage.from('todo-files').upload(path, f.blob, { contentType: f.mime, cacheControl: '3600', upsert: false });
  if (error) throw new Error('“' + file.name + '” didn’t upload. Try again.');
  return { path, name: f.name.slice(0, 120), mime: f.mime, size: f.blob.size };
}

/** Short-lived links to open files in the private bucket, by path. */
export async function signTodoFiles(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabase.storage.from('todo-files').createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  for (const r of data || []) if (r.path && r.signedUrl) out[r.path] = r.signedUrl;
  return out;
}

/** Tidies dictated text (punctuation, obvious mis-heard words) on the studio's
    server. Never throws: on any problem the spoken text stands as it is. */
export async function tidyDictation(text: string, context: string): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return text;
    const r = await fetch('https://embed.design/api/portal/tidy', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ text, context }), signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return text;
    const d = await r.json();
    return typeof d.text === 'string' && d.text.trim() ? d.text.trim() : text;
  } catch { return text; }
}
/** Live changes to to-dos, comments and time on a project. */
export function subscribeRetainer(projectId: string, onChange: () => void) {
  const f = 'project_id=eq.' + projectId;
  const ch = supabase.channel('web-retainer:' + projectId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: f }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_comments', filter: f }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: f }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
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
