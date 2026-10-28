import type { Currency } from '../lib/format';

export const PHASE_KEYS = ['research', 'strategy', 'ideation', 'design', 'handover'] as const;
export type PhaseKey = (typeof PHASE_KEYS)[number];
export const PHASE_NAMES: Record<PhaseKey, string> = {
  research: 'Research', strategy: 'Strategy', ideation: 'Ideation', design: 'Design', handover: 'Handover',
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  title: string;
  currency: Currency;
  notify: boolean;
};

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  status: 'proposal' | 'active' | 'complete';
  currentPhase: PhaseKey;
  progress: number;
  phaseSummary: string;
  startOn: string | null;
  dueOn: string | null;
  contractInr: number | null;
  leadName: string;
  budgetLabel: string | null;
  timing: string | null;
};

export type Phase = { key: PhaseKey; nowLabel: string; blurb: string };

export type DeliverableStatus = 'done' | 'review' | 'progress' | 'upcoming';
export type Deliverable = {
  id: string; phase: PhaseKey; name: string; status: DeliverableStatus; note: string; approvalId: string | null;
};

export type ProjectFile = { id: string; phase: PhaseKey; name: string; ext: string; meta: string; url: string | null };

export type TeamMember = { id: string; name: string; role: string };

export type ApprovalStatus = 'pending' | 'approved' | 'changes';
export type Approval = {
  id: string;
  phase: PhaseKey;
  title: string;
  kind: string;
  meta: string;
  note: string;
  ownerName: string;
  dueOn: string | null;
  status: ApprovalStatus;
  decidedAt: string | null;
  previewUrl: string | null;
  figmaUrl: string | null;
};

export type QuoteLine = { id: string; name: string; qty: string; amountInr: number };

export type RequestStatus = 'reviewing' | 'quoted' | 'accepted' | 'declined';
export type ScopeRequest = {
  id: string;
  ref: string;
  title: string;
  summary: string;
  status: RequestStatus;
  priceInr: number | null;
  timeline: string | null;
  newDueOn: string | null;
  validUntil: string | null;
  quoteNote: string | null;
  lines: QuoteLine[];
};

export type InvoiceStatus = 'scheduled' | 'due' | 'paid';
export type Invoice = {
  id: string;
  ref: string;
  title: string;
  amountInr: number;
  status: InvoiceStatus;
  dueOn: string | null;
  paidOn: string | null;
  paymentUrl: string | null;
  receiptUrl: string | null;
};

export type ActivityItem = { id: string; body: string; actorName: string; createdAt: string };

export type Message = { id: string; authorId: string | null; authorName: string; fromClient: boolean; body: string; createdAt: string };

export type ProjectDetail = {
  project: Project;
  phases: Phase[];
  deliverables: Deliverable[];
  files: ProjectFile[];
  team: TeamMember[];
  approvals: Approval[];
  requests: ScopeRequest[];
  invoices: Invoice[];
  activity: ActivityItem[];
};

export type ScopeBrief = { types: string[]; description: string; goal: string; priority: 'Low' | 'Normal' | 'Urgent'; timing: string };
export type ProjectBrief = { name: string; services: string[]; brief: string; goal: string; budgetLabel: string; timing: string };

export type MessageEvents = { onMessage: (m: Message) => void; onTyping?: (typing: boolean) => void };

export interface Api {
  /** 'demo' runs on in-memory seed data; 'live' talks to Supabase. */
  readonly mode: 'demo' | 'live';

  getSessionEmail(): Promise<string | null>;
  onAuthChange(cb: (email: string | null) => void): () => void;
  sendMagicLink(email: string): Promise<void>;
  /** Finishes sign-in from a magic-link deep link. Returns false if the URL carried no session. */
  completeSignInFromUrl(url: string): Promise<boolean>;
  signOut(): Promise<void>;

  loadProfile(): Promise<Profile>;
  updateProfile(patch: Partial<Pick<Profile, 'currency' | 'notify'>>): Promise<void>;
  listProjects(): Promise<Project[]>;
  loadProject(id: string): Promise<ProjectDetail>;

  listMessages(projectId: string): Promise<Message[]>;
  sendMessage(projectId: string, body: string): Promise<void>;
  subscribeMessages(projectId: string, events: MessageEvents): () => void;

  approve(approvalId: string): Promise<void>;
  undoApproval(approvalId: string): Promise<void>;
  requestChanges(approvalId: string, feedback: string): Promise<void>;
  submitScopeRequest(projectId: string, brief: ScopeBrief): Promise<string>;
  acceptQuote(requestId: string): Promise<void>;
  undoAcceptQuote(requestId: string): Promise<void>;
  submitProjectBrief(brief: ProjectBrief): Promise<string>;
}
