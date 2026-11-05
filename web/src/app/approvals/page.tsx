'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Empty, Meta, Pill, Tag, type Tone } from '@/components/ui';
import { approve, PHASE_NAMES, requestChanges, undoApproval, type Approval } from '@/lib/data';
import { decidedOn, dueIn } from '@/lib/format';

const STATUS: Record<Approval['status'], [string, Tone]> = { pending: ['Needs you', 'mint'], approved: ['Approved', 'good'], changes: ['Changes requested', 'warn'] };

function Approvals() {
  const { detail } = useApp();
  const d = detail!;
  const router = useRouter();
  const id = useSearchParams().get('id');
  const pending = d.approvals.filter(a => a.status === 'pending');
  const decided = d.approvals.filter(a => a.status !== 'pending');
  const selected = d.approvals.find(a => a.id === id) || pending[0] || decided[0] || null;
  const open = (a: Approval) => router.replace('/approvals/?id=' + a.id, { scroll: false });

  const Row = ({ a, i }: { a: Approval; i: number }) => (
    <button className="row" aria-current={selected?.id === a.id} onClick={() => open(a)} style={{ animation: `up .45s var(--ease) ${i * 50}ms both` }}>
      {a.status === 'pending' ? <span className="dot" /> : <span className={'tick ' + (a.status === 'approved' ? 'done' : '')}>{a.status === 'approved' ? '✓' : ''}</span>}
      <span className="grow"><strong>{a.title}</strong><small><Meta parts={[a.kind, a.meta, a.status !== 'pending' && decidedOn(a.decidedAt)]} /></small></span>
      {a.status === 'pending' && a.dueOn ? <span className="mono" style={{ fontSize: 12, color: Date.parse(a.dueOn) - Date.now() < 3 * 864e5 ? 'var(--warn)' : 'var(--mu)' }}>{dueIn(a.dueOn)}</span> : a.status === 'changes' ? <Pill tone="warn">Changes</Pill> : null}
    </button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p><Tag tag="rule">Nothing moves without you</Tag></p>
        </div>
      </div>
      {!d.approvals.length ? <Empty title="Nothing to approve yet">When the team needs a decision — screens, flows, tokens — it lands here with everything you need to decide.</Empty> : (
        <div className="split">
          <div className="stack" style={{ gap: 20 }}>
            <section className="section">
              <span className="eyebrow">Waiting on you ({pending.length})</span>
              {pending.length ? <div className="card card-flush">{pending.map((a, i) => <Row key={a.id} a={a} i={i} />)}</div>
                : <div className="empty" style={{ padding: 24 }}><Tag tag="inbox-zero">Nothing waiting on you</Tag></div>}
            </section>
            {decided.length > 0 && (
              <section className="section">
                <span className="eyebrow">Decided</span>
                <div className="card card-flush">{decided.map((a, i) => <Row key={a.id} a={a} i={i} />)}</div>
              </section>
            )}
          </div>
          {selected && <ApprovalDetail key={selected.id} a={selected} />}
        </div>
      )}
    </div>
  );
}

function ApprovalDetail({ a }: { a: Approval }) {
  const { refresh, toast, celebrate } = useApp();
  const [changes, setChanges] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, tone] = STATUS[a.status];

  const doApprove = async () => {
    setBusy(true); setErr(null);
    try {
      await approve(a.id);
      await celebrate('Approved', 'approved', a.title);
      await refresh();
      toast('Approved “' + a.title + '”', async () => {
        try { await undoApproval(a.id); await refresh(); toast('Approval undone.'); } catch { toast('Too late to undo — message the team instead.'); }
      });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const doChanges = async () => {
    if (feedback.trim().length < 12) return setErr('Add at least a sentence so the team can act on it.');
    setBusy(true); setErr(null);
    try { await requestChanges(a.id, feedback.trim()); await refresh(); toast('Sent to ' + a.ownerName + '. Follow it in Messages.'); setChanges(false); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <article className="card stack split-detail" style={{ gap: 16 }}>
      <div className="section-head">
        <span className="eyebrow"><Meta parts={[a.kind, PHASE_NAMES[a.phase], 'from ' + a.ownerName]} /></span>
        <Pill tone={tone}>{label}</Pill>
      </div>
      <h2 style={{ fontSize: 30, lineHeight: 1.08 }}>{a.title}</h2>
      {a.previewUrl
        ? <a href={a.previewUrl} target="_blank" rel="noopener" className="preview" style={{ backgroundImage: `url(${a.previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><span>Open preview ↗</span></a>
        : <div className="preview"><div className="frames"><i /><i /><i /><i /></div><span><Meta parts={['Preview', a.meta]} /></span></div>}
      {a.note && <p style={{ margin: 0 }}>{a.note}</p>}
      <div className="actions">
        {a.figmaUrl && <a className="btn btn-quiet btn-sm" href={a.figmaUrl} target="_blank" rel="noopener">Open in Figma ↗</a>}
        <Link className="btn btn-quiet btn-sm" href="/messages/">Ask {a.ownerName}</Link>
      </div>
      {a.status === 'pending' ? (
        changes ? (
          <div className="stack">
            <label className="field">
              <span>What should change?</span>
              <textarea rows={4} autoFocus value={feedback} onChange={e => { setFeedback(e.target.value); setErr(null); }} placeholder="Be specific — screen, element, and why. We’ll turn it into tickets." />
            </label>
            {err && <p className="err" role="alert">{err}</p>}
            <div className="actions">
              <button className="btn" disabled={busy} onClick={doChanges}>{busy ? 'Sending…' : 'Send change request'}</button>
              <button className="link" onClick={() => { setChanges(false); setErr(null); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="stack">
            {err && <p className="err" role="alert">{err}</p>}
            <div className="actions">
              <button className="btn" disabled={busy} onClick={doApprove}>{busy ? 'Approving…' : 'Approve'}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => setChanges(true)}>Request changes</button>
            </div>
            <p className="hint">Approving lets the team move on. You can undo for two minutes.</p>
          </div>
        )
      ) : (
        <div className={'notice' + (a.status === 'changes' ? ' warn' : '')}>
          <Meta parts={[<b key="l">{label}</b>, decidedOn(a.decidedAt)]} />
          {a.feedback && <p className="quote" style={{ marginTop: 8 }}>{a.feedback}</p>}
        </div>
      )}
    </article>
  );
}

export default function ApprovalsPage() {
  return <Suspense><Approvals /></Suspense>;
}
