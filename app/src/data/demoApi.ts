// In-memory implementation of Api, seeded with the design prototype's data.
// Used when EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY are not set.

import type {
  Api, Approval, Deliverable, Invoice, Message, MessageEvents, PhaseKey, Profile, Project, ProjectDetail, ProjectFile, ScopeRequest,
} from './types';
import { PHASE_KEYS } from './types';

const DAY = 86400000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
const date = (offsetDays: number) => iso(offsetDays).slice(0, 10);
let seq = 0;
const uid = (p: string) => p + '-' + Date.now().toString(36) + '-' + (seq++);
const wait = (ms = 250) => new Promise(r => setTimeout(r, ms));

const PHASE_COPY: Record<PhaseKey, { now: string; blurb: string; items: string[]; files: [string, string, string][] }> = {
  research: { now: 'wrapped', blurb: 'We learned who your users are and where the current product fails them. Everything downstream is anchored to these findings.', items: ['Product research', 'Stakeholder interviews', 'UX audit', 'Benchmarking'], files: [['PDF', 'UX audit — v1.pdf', '42 pages · 14 Aug'], ['FIG', 'Benchmarking board', 'FigJam · 9 Aug']] },
  strategy: { now: 'wrapped', blurb: 'The experience map, sitemap and user journeys that define what we are building and why.', items: ['Experience mapping', 'Sitemapping', 'User flow & journey'], files: [['FIG', 'Experience map', 'FigJam · 2 Sep'], ['PDF', 'Sitemap v3.pdf', '6 pages · 8 Sep']] },
  ideation: { now: 'wrapped', blurb: 'Concepts and low-fidelity wireframes, tested with your team before any pixels were polished.', items: ['Concept sketching', 'Low-fi wireframing', 'Design feedback'], files: [['FIG', 'Low-fi wireframes v2', 'Figma · 1 Oct']] },
  design: { now: 'hi-fi wireframing', blurb: 'Hi-fidelity screens, an interactive prototype and the design system your engineers will build from.', items: ['Hi-fi wireframing', 'Prototyping', 'Responsive design', 'Design system'], files: [['FIG', 'Hi-fi v2', 'Figma · updated today'], ['FIG', 'Prototype v0.9', 'Figma · 24 Oct']] },
  handover: { now: 'upcoming', blurb: 'Documented handover, design QA on builds, Jira moduling and post-launch UI enhancements.', items: ['Design handover', 'Design testing', 'Jira moduling', 'UI enhancements'], files: [] },
};

const TEAM = [{ id: 't1', name: 'Arnav', role: 'Project lead' }, { id: 't2', name: 'Anushka', role: 'UI designer' }, { id: 't3', name: 'Yash', role: 'Front-end' }];

type Store = {
  profile: Profile;
  projects: Project[];
  approvals: Record<string, (Approval & { decidedBy?: string })[]>;
  requests: Record<string, (ScopeRequest & { acceptedAt?: string })[]>;
  invoices: Record<string, (Invoice & { requestId?: string })[]>;
  messages: Record<string, Message[]>;
  activity: Record<string, { id: string; body: string; actorName: string; createdAt: string }[]>;
  deliverables: Record<string, Deliverable[]>;
};

function seed(): Store {
  const projects: Project[] = [
    { id: 'nimai', name: 'Nimai Wealth', subtitle: 'Mobile app redesign', status: 'active', currentPhase: 'design', progress: 62, phaseSummary: '2 deliverables waiting on your review', startOn: date(-70), dueOn: date(45), contractInr: 1920000, leadName: 'Arnav', budgetLabel: null, timing: null },
    { id: 'korklub', name: 'Korklub', subtitle: 'Shopify storefront', status: 'active', currentPhase: 'strategy', progress: 28, phaseSummary: 'On track', startOn: date(-14), dueOn: date(94), contractInr: 840000, leadName: 'Arnav', budgetLabel: null, timing: null },
    { id: 'bthere', name: 'BThere', subtitle: 'Design system', status: 'active', currentPhase: 'handover', progress: 91, phaseSummary: 'On track', startOn: date(-88), dueOn: date(10), contractInr: 1100000, leadName: 'Arnav', budgetLabel: null, timing: null },
  ];
  const nimaiApprovals: Approval[] = [
    { id: 'a1', phase: 'design', title: 'Portfolio dashboard — hi-fi v2', kind: 'Hi-fi screens', meta: '14 screens', ownerName: 'Anushka', dueOn: date(2), status: 'pending', decidedAt: null, previewUrl: null, figmaUrl: null, note: 'Second pass on the dashboard after your note on information density. Holdings now lead; performance moved under a tab. Approving unlocks the Transactions screens.' },
    { id: 'a2', phase: 'design', title: 'Colour & type foundations', kind: 'Design system', meta: 'tokens', ownerName: 'Arnav', dueOn: date(5), status: 'pending', decidedAt: null, previewUrl: null, figmaUrl: null, note: 'The token set the whole UI will inherit: 2 brand colours, 5 greys, a 7-step type scale. Low risk to approve now; easy to retune later.' },
    { id: 'a3', phase: 'design', title: 'Onboarding flow v3', kind: 'Hi-fi screens', meta: '9 screens', ownerName: 'Anushka', dueOn: null, status: 'approved', decidedAt: iso(-7), previewUrl: null, figmaUrl: null, note: 'KYC reduced from 6 to 4 steps; progressive disclosure for PAN details.' },
    { id: 'a4', phase: 'strategy', title: 'User journey map', kind: 'Strategy', meta: '3 journeys', ownerName: 'Arnav', dueOn: null, status: 'approved', decidedAt: iso(-26), previewUrl: null, figmaUrl: null, note: 'First-investment, SIP top-up and withdrawal journeys with pain points ranked.' },
  ];
  const nimaiRequests: ScopeRequest[] = [
    { id: 'r2', ref: 'SCR-02', title: 'Dark mode across the app', summary: 'Theme tokens, 12 hi-fi screens re-cut, prototype update.', status: 'quoted', priceInr: 240000, timeline: '+9 working days', newDueOn: date(56), validUntil: date(8), quoteNote: 'Sized tight because the token work is already half done in the design system. If you want it later, the price holds for 7 days.', lines: [{ id: 'l1', name: 'Dark token set', qty: '1 set · 2 days', amountInr: 50000 }, { id: 'l2', name: 'Hi-fi screens, dark', qty: '12 screens', amountInr: 120000 }, { id: 'l3', name: 'Prototype update', qty: 'v1 → v1.1', amountInr: 40000 }, { id: 'l4', name: 'QA & contrast audit', qty: '1 day', amountInr: 30000 }] },
    { id: 'r1', ref: 'SCR-01', title: 'Referral screen', summary: 'Invite flow and rewards ledger.', status: 'accepted', priceInr: 95000, timeline: '+4 working days', newDueOn: date(45), validUntil: null, quoteNote: 'Accepted; in Design.', lines: [{ id: 'l5', name: 'Hi-fi screens', qty: '4 screens', amountInr: 60000 }, { id: 'l6', name: 'Prototype update', qty: '', amountInr: 35000 }] },
  ];
  const nimaiInvoices: Invoice[] = [
    { id: 'i1', ref: 'INV-0151', title: 'Milestone 2 — Strategy & Ideation', amountInr: 480000, status: 'due', dueOn: date(18), paidOn: null, paymentUrl: null, receiptUrl: null },
    { id: 'i2', ref: 'INV-0149', title: 'Scope: Referral screen (50%)', amountInr: 47500, status: 'paid', dueOn: null, paidOn: date(-17), paymentUrl: null, receiptUrl: null },
    { id: 'i3', ref: 'INV-0142', title: 'Milestone 1 — Research', amountInr: 480000, status: 'paid', dueOn: null, paidOn: date(-27), paymentUrl: null, receiptUrl: null },
  ];
  const deliverables: Record<string, Deliverable[]> = {};
  for (const p of projects) {
    const cur = PHASE_KEYS.indexOf(p.currentPhase);
    deliverables[p.id] = PHASE_KEYS.flatMap((k, i): Deliverable[] =>
      p.id === 'nimai' && k === 'design'
        ? [
            { id: 'd-hifi', phase: k, name: 'Hi-fi wireframing', status: 'review' as const, note: '14 of 22 screens · dashboard in review', approvalId: 'a1' },
            { id: 'd-proto', phase: k, name: 'Prototyping', status: 'progress' as const, note: 'v0.9 shared · v1 after dashboard sign-off', approvalId: null },
            { id: 'd-resp', phase: k, name: 'Responsive design', status: 'upcoming' as const, note: 'Tablet breakpoints · starts in 2 weeks', approvalId: null },
            { id: 'd-ds', phase: k, name: 'Design system', status: 'progress' as const, note: 'Tokens & 31 components documented', approvalId: null },
          ]
        : PHASE_COPY[k].items.map((name, j) => ({
            id: `${p.id}-${k}-${j}`, phase: k, name, approvalId: null,
            status: i < cur ? 'done' as const : i === cur ? 'progress' as const : 'upcoming' as const,
            note: i < cur ? 'Delivered' : i === cur ? 'In progress' : 'Not started',
          })),
    );
  }
  return {
    profile: { id: 'me', email: '', fullName: 'Priya Raman', title: 'VP Product', currency: 'INR', notify: true },
    projects,
    approvals: { nimai: nimaiApprovals, korklub: [], bthere: [] },
    requests: { nimai: nimaiRequests, korklub: [], bthere: [] },
    invoices: { nimai: nimaiInvoices, korklub: [], bthere: [] },
    deliverables,
    messages: {
      nimai: [
        { id: 'm1', authorId: null, authorName: 'Anushka', fromClient: false, body: 'Hi Priya — dashboard v2 is up for review. Main change: holdings first, performance under a tab, as discussed.', createdAt: iso(-2.1) },
        { id: 'm2', authorId: 'me', authorName: 'Priya Raman', fromClient: true, body: 'Thanks. Will go through it tonight. Any chance the dark-mode quote lands this week?', createdAt: iso(-1.9) },
        { id: 'm3', authorId: null, authorName: 'Arnav', fromClient: false, body: 'Posted it under Scope just now — ₹2.4L, +9 days. Happy to walk you through it.', createdAt: iso(-1.1) },
      ],
    },
    activity: {
      nimai: [
        { id: 'e1', body: 'Quote posted for “Dark mode across the app”', actorName: 'Arnav', createdAt: iso(-1) },
        { id: 'e2', body: 'Portfolio dashboard v2 sent for your review', actorName: 'Anushka', createdAt: iso(-2) },
        { id: 'e3', body: 'Design tokens documented — 31 components', actorName: 'Yash', createdAt: iso(-3) },
        { id: 'e4', body: 'Onboarding v3 approved — Transactions screens started', actorName: 'Priya Raman', createdAt: iso(-6) },
      ],
    },
  };
}

const UNDO_MS = 2 * 60 * 1000;

export function createDemoApi(): Api {
  let db = seed();
  let session: string | null = null;
  const authListeners = new Set<(e: string | null) => void>();
  const msgListeners = new Map<string, Set<MessageEvents>>();
  let replied = false;

  const setSession = (email: string | null) => { session = email; authListeners.forEach(l => l(email)); };
  const log = (pid: string, body: string) => { (db.activity[pid] ??= []).unshift({ id: uid('e'), body, actorName: db.profile.fullName, createdAt: iso(0) }); };
  const findApproval = (id: string) => {
    for (const [pid, list] of Object.entries(db.approvals)) { const a = list.find(x => x.id === id); if (a) return { pid, a }; }
    throw new Error('not found');
  };
  const findRequest = (id: string) => {
    for (const [pid, list] of Object.entries(db.requests)) { const r = list.find(x => x.id === id); if (r) return { pid, r }; }
    throw new Error('not found');
  };
  const pushMessage = (pid: string, m: Message) => {
    (db.messages[pid] ??= []).push(m);
    msgListeners.get(pid)?.forEach(l => l.onMessage(m));
  };
  const typing = (pid: string, on: boolean) => msgListeners.get(pid)?.forEach(l => l.onTyping?.(on));

  return {
    mode: 'demo',

    async getSessionEmail() { return session; },
    onAuthChange(cb) { authListeners.add(cb); return () => { authListeners.delete(cb); }; },
    async sendMagicLink(email) {
      await wait(900);
      db.profile.email = email;
      // No inbox in demo mode: behave as if the link was opened on this phone.
      setSession(email);
    },
    async completeSignInFromUrl() { return false; },
    async verifyCode(email) { setSession(email); },
    async signOut() { db = seed(); replied = false; setSession(null); },

    async loadProfile() { await wait(120); return { ...db.profile }; },
    async updateProfile(patch) { db.profile = { ...db.profile, ...patch }; },
    async listProjects() { await wait(120); return db.projects.map(p => ({ ...p })); },
    async loadProject(id): Promise<ProjectDetail> {
      await wait(180);
      const project = db.projects.find(p => p.id === id);
      if (!project) throw new Error('not found');
      const cur = PHASE_KEYS.indexOf(project.currentPhase);
      const files: ProjectFile[] = project.status === 'proposal' ? [] : PHASE_KEYS.flatMap((k, i) =>
        i > cur ? [] : PHASE_COPY[k].files.map(([ext, name, meta], j) => ({ id: `${id}-${k}-f${j}`, phase: k, ext, name, meta, url: null })));
      return {
        project: { ...project },
        phases: PHASE_KEYS.map(k => ({
          key: k,
          nowLabel: project.status === 'proposal' ? '' : id === 'korklub' && k === 'strategy' ? 'experience mapping' : id === 'bthere' && k === 'handover' ? 'design QA' : PHASE_COPY[k].now,
          blurb: PHASE_COPY[k].blurb,
        })),
        deliverables: (db.deliverables[id] ?? []).map(d => ({ ...d })),
        files,
        team: TEAM,
        approvals: (db.approvals[id] ?? []).map(a => ({ ...a })),
        requests: (db.requests[id] ?? []).map(r => ({ ...r, lines: [...r.lines] })),
        invoices: (db.invoices[id] ?? []).map(i => ({ ...i })),
        activity: (db.activity[id] ?? []).slice(0, 6).map(a => ({ ...a })),
      };
    },

    async listMessages(pid) { await wait(120); return [...(db.messages[pid] ?? [])]; },
    async sendMessage(pid, body) {
      pushMessage(pid, { id: uid('m'), authorId: 'me', authorName: db.profile.fullName, fromClient: true, body, createdAt: iso(0) });
      if (replied) return;
      replied = true;
      setTimeout(() => typing(pid, true), 700);
      setTimeout(() => {
        typing(pid, false);
        pushMessage(pid, { id: uid('m'), authorId: null, authorName: 'Arnav', fromClient: false, body: 'Got it — on it. I’ll update you here before Thursday’s review.', createdAt: iso(0) });
      }, 2600);
    },
    subscribeMessages(pid, events) {
      const set = msgListeners.get(pid) ?? new Set();
      set.add(events); msgListeners.set(pid, set);
      return () => { set.delete(events); };
    },

    async approve(id) {
      await wait();
      const { pid, a } = findApproval(id);
      if (a.status !== 'pending') throw new Error('Already decided');
      Object.assign(a, { status: 'approved', decidedAt: iso(0), decidedBy: 'me' });
      db.deliverables[pid]?.filter(d => d.approvalId === id).forEach(d => Object.assign(d, { status: 'done', note: 'Approved' }));
      log(pid, a.title + ' approved');
    },
    async undoApproval(id) {
      await wait();
      const { pid, a } = findApproval(id);
      if (a.status !== 'approved' || !a.decidedAt || Date.now() - Date.parse(a.decidedAt) > UNDO_MS) throw new Error('Too late to undo');
      Object.assign(a, { status: 'pending', decidedAt: null });
      db.deliverables[pid]?.filter(d => d.approvalId === id).forEach(d => Object.assign(d, { status: 'review', note: 'In review' }));
      db.activity[pid] = (db.activity[pid] ?? []).filter(e => e.body !== a.title + ' approved');
    },
    async requestChanges(id, feedback) {
      await wait();
      const { pid, a } = findApproval(id);
      if (feedback.trim().length < 12) throw new Error('Add at least a sentence');
      Object.assign(a, { status: 'changes', decidedAt: iso(0) });
      pushMessage(pid, { id: uid('m'), authorId: 'me', authorName: db.profile.fullName, fromClient: true, body: 'Changes on “' + a.title + '”: ' + feedback.trim(), createdAt: iso(0) });
    },
    async submitScopeRequest(pid, b) {
      await wait(400);
      const list = (db.requests[pid] ??= []);
      const id = uid('r');
      const title = b.description.trim().split(/[.\n]/)[0].slice(0, 48);
      list.unshift({
        id, ref: 'SCR-' + String(list.length + 1).padStart(2, '0'), title,
        summary: b.types.join(', ') + ' · ' + b.priority + ' · ' + (b.timing || 'Flexible'),
        status: 'reviewing', priceInr: null, timeline: null, newDueOn: null, validUntil: null, quoteNote: null, lines: [],
      });
      log(pid, 'Scope brief sent: “' + title + '”');
      return id;
    },
    async acceptQuote(id) {
      await wait();
      const { pid, r } = findRequest(id);
      if (r.status !== 'quoted') throw new Error('No open quote');
      Object.assign(r, { status: 'accepted', acceptedAt: iso(0) });
      (db.invoices[pid] ??= []).unshift({ id: uid('i'), requestId: id, ref: 'INV-0152', title: 'Scope: ' + r.title + ' (50%)', amountInr: (r.priceInr ?? 0) / 2, status: 'scheduled', dueOn: date(7), paidOn: null, paymentUrl: null, receiptUrl: null });
      log(pid, 'Quote accepted: “' + r.title + '”');
    },
    async undoAcceptQuote(id) {
      await wait();
      const { pid, r } = findRequest(id);
      if (r.status !== 'accepted' || !r.acceptedAt || Date.now() - Date.parse(r.acceptedAt) > UNDO_MS) throw new Error('Too late to undo');
      Object.assign(r, { status: 'quoted', acceptedAt: undefined });
      db.invoices[pid] = (db.invoices[pid] ?? []).filter(i => !(i.requestId === id && i.status === 'scheduled'));
      db.activity[pid] = (db.activity[pid] ?? []).filter(e => e.body !== 'Quote accepted: “' + r.title + '”');
    },
    async submitProjectBrief(b) {
      await wait(400);
      const id = uid('p');
      db.projects.push({
        id, name: b.name.trim(), subtitle: b.services[0] ?? 'New project', status: 'proposal', currentPhase: 'research', progress: 0,
        phaseSummary: '', startOn: null, dueOn: null, contractInr: null, leadName: 'Arnav',
        budgetLabel: b.budgetLabel || 'Not sure yet', timing: b.timing || 'Flexible',
      });
      db.deliverables[id] = [];
      return id;
    },
  };
}
