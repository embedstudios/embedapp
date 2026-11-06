'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Empty, Meta, Pill, Tag, type Tone } from '@/components/ui';
import { acceptQuote, submitScopeRequest, undoAcceptQuote, type ScopeRequest } from '@/lib/data';
import { dayMonth, money, moneyAlt, quoteEta } from '@/lib/format';

const STATUS: Record<ScopeRequest['status'], [string, Tone]> = { reviewing: ['Sizing', 'info'], quoted: ['Quote ready', 'mint'], accepted: ['Accepted', 'good'], declined: ['Declined', 'mute'] };
const TYPES = ['New screens', 'New feature', 'Design system', 'Research & testing', 'Website'];
const PRIOS = ['Low', 'Normal', 'Urgent'];
const WHENS = [
  { name: 'As soon as possible', sub: 'We re-plan the current phase around it' },
  { name: 'Next phase', sub: 'Slots in without moving the due date' },
  { name: 'Flexible', sub: 'Usually the best price' },
];

function Scope() {
  const { detail } = useApp();
  const d = detail!;
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const composing = params.get('new') === '1';
  const selected = d.requests.find(r => r.id === id) || (!composing ? d.requests[0] : null) || null;
  const proposal = d.project.status === 'proposal';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Scope &amp; quotes</h1>
          <p>Need something that isn’t in the plan? Add a new scope here. You get a fixed-price quote with the timeline within one working day, and nothing is billed until you accept.</p>
        </div>
        {!proposal && <button className="btn" onClick={() => router.replace('/scope/?new=1', { scroll: false })}>Add a new scope</button>}
      </div>
      <div className="split">
        <div className="stack" style={{ gap: 20 }}>
          {d.requests.length ? (
            <div className="card card-flush">
              {d.requests.map((r, i) => {
                const [label, tone] = STATUS[r.status];
                return (
                  <button key={r.id} className="row" aria-current={!composing && selected?.id === r.id} onClick={() => router.replace('/scope/?id=' + r.id, { scroll: false })} style={{ animation: `up .45s var(--ease) ${i * 50}ms both` }}>
                    <span className="grow"><strong>{r.title}</strong><small><Meta parts={[r.ref, r.summary]} /></small></span>
                    <Pill tone={tone}>{label}</Pill>
                  </button>
                );
              })}
            </div>
          ) : !composing && <Empty title="No new scope yet">Add new screens, features or research any time. Each new scope gets its own fixed-price quote.</Empty>}
          <div className="card stack" style={{ gap: 12 }}>
            <Tag tag="how-it-works" />
            <ol className="stack" style={{ gap: 8, margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li><b>Brief</b> — what, why and when. About two minutes.</li>
              <li><b>Quote</b> — fixed price and timeline from Embed, within a working day.</li>
              <li><b>Accept</b> — here. Work is scheduled; 50% is invoiced on acceptance, 50% on delivery.</li>
            </ol>
          </div>
        </div>
        {composing ? <BriefForm onDone={newId => router.replace(newId ? '/scope/?id=' + newId : '/scope/', { scroll: false })} />
          : selected ? <QuoteDetail key={selected.id} r={selected} /> : null}
      </div>
    </div>
  );
}

function QuoteDetail({ r }: { r: ScopeRequest }) {
  const { cur, setCur, detail, refresh, toast, celebrate } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /* Quotes come from the studio, not a named person. */
  const lead = 'Embed';
  const price = r.priceInr || 0;
  const [label, tone] = STATUS[r.status];
  const expired = r.status === 'quoted' && !!r.validUntil && r.validUntil < new Date().toISOString().slice(0, 10);

  const accept = async () => {
    setBusy(true); setErr(null);
    try {
      await acceptQuote(r.id);
      setConfirm(false);
      await celebrate('Scheduled', 'accepted', money(price, cur) + (r.timeline ? ', ' + r.timeline : ''));
      await refresh();
      toast('Quote accepted. Work is scheduled.', async () => {
        try { await undoAcceptQuote(r.id); await refresh(); toast('Acceptance undone.'); } catch { toast('Too late to undo. Message the Embed team instead.'); }
      });
    } catch (e) { setErr((e as Error).message); setConfirm(false); }
    setBusy(false);
  };

  return (
    <article className="card stack split-detail" style={{ gap: 16 }}>
      <div className="section-head"><span className="eyebrow"><Meta parts={[r.ref, r.types.join(', ')]} /></span><Pill tone={tone}>{label}</Pill></div>
      <h2 style={{ fontSize: 30, lineHeight: 1.08 }}>{r.title}</h2>
      <p className="quote">{r.description}</p>
      {r.goal && <p className="hint">Goal: {r.goal}</p>}

      {r.status === 'reviewing' && (
        <div className="empty" style={{ padding: 24 }}>
          <strong>We’re sizing it</strong>
          <p>Embed will post a fixed-price quote here by {quoteEta()}. You’ll get an email.</p>
        </div>
      )}

      {(r.status === 'quoted' || r.status === 'accepted') && (
        <>
          <div className="section-head">
            <span className="eyebrow">Fixed price</span>
            <span className="seg">{(['INR', 'USD'] as const).map(c => <button key={c} aria-pressed={cur === c} onClick={() => setCur(c)}>{c}</button>)}</span>
          </div>
          <div>
            <div className="big-money">{money(price, cur)}</div>
            <p className="hint" style={{ marginTop: 6 }}><Meta parts={['≈ ' + moneyAlt(price, cur), 'excl. taxes', r.validUntil && r.status === 'quoted' && 'valid until ' + dayMonth(r.validUntil)]} /></p>
          </div>
          <div className="lines">
            {r.lines.map((l, i) => <div key={i}><span>{l.name}{l.qty && <small>{l.qty}</small>}</span><span className="amt">{money(l.amountInr, cur)}</span></div>)}
          </div>
          <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="stat"><span className="eyebrow">Timeline</span><b>{r.timeline || '—'}</b></div>
            <div className="stat"><span className="eyebrow">New due date</span><b>{r.newDueOn ? dayMonth(r.newDueOn) : '—'}</b></div>
          </div>
          {r.quoteNote && <div className="notice"><b>Note from {lead}:</b> {r.quoteNote}</div>}
        </>
      )}

      {r.status === 'quoted' && (expired
        ? <div className="notice warn">This price has expired. Message the Embed team for a fresh quote.</div>
        : <div className="actions">
            <button className="btn" onClick={() => setConfirm(true)}>Accept quote</button>
            <a className="btn btn-ghost" href="/messages/">Discuss first</a>
          </div>)}
      {r.status === 'accepted' && <div className="notice"><b>Accepted.</b> It’s in the plan, and 50% is invoiced — see Billing.</div>}
      {r.status === 'declined' && r.quoteNote && <div className="notice warn">{r.quoteNote}</div>}
      {err && <p className="err" role="alert">{err}</p>}

      {confirm && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Accept quote" onClick={e => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="modal-card">
            <h2>Accept {money(price, cur)} for “{r.title}”?</h2>
            <ul>
              <li>Adds <b style={{ color: 'var(--tx)' }}>{r.timeline || 'the quoted work'}</b>{r.newDueOn ? '; new due date ' + dayMonth(r.newDueOn) : ''}.</li>
              <li>50% ({money(price / 2, cur)}) is invoiced now, 50% on delivery.</li>
              <li>You can undo for two minutes after accepting; after that, message the Embed team.</li>
            </ul>
            <div className="actions">
              <button className="btn" disabled={busy} onClick={accept}>{busy ? 'Accepting…' : 'Yes, accept'}</button>
              <button className="link" onClick={() => setConfirm(false)}>Not yet</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function BriefForm({ onDone }: { onDone: (id?: string) => void }) {
  const { detail, refresh, toast, celebrate } = useApp();
  const d = detail!;
  const [types, setTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [timing, setTiming] = useState('');
  /* "By a date" and "Within a set time" carry their own values; the team gets plain text. */
  const [byDate, setByDate] = useState('');
  const [within, setWithin] = useState({ n: '', unit: 'weeks' });
  const today = new Date().toISOString().slice(0, 10);
  const timingText = timing === 'By a date' ? (byDate ? 'By ' + dayMonth(byDate) + ' ' + byDate.slice(0, 4) : '')
    : timing === 'Within a set time' ? (Number(within.n) > 0 ? 'Within ' + Number(within.n) + ' ' + (Number(within.n) === 1 ? within.unit.replace(/s$/, '') : within.unit) : '')
    : timing;
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Keep an unsent draft in this tab.
  useEffect(() => {
    try { const s = JSON.parse(sessionStorage.getItem('embed_brief') || 'null'); if (s) { setTypes(s.types || []); setDescription(s.description || ''); setGoal(s.goal || ''); setPriority(s.priority || 'Normal'); setTiming(s.timing || ''); } } catch { /* no draft */ }
  }, []);
  useEffect(() => { try { sessionStorage.setItem('embed_brief', JSON.stringify({ types, description, goal, priority, timing })); } catch { /* storage off */ } }, [types, description, goal, priority, timing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!types.length || description.trim().length < 10) return setErr('Pick at least one type and describe it in a sentence or two.');
    if ((timing === 'By a date' || timing === 'Within a set time') && !timingText) return setErr(timing === 'By a date' ? 'Pick the date you need it by.' : 'Enter how many weeks or months.');
    setBusy(true); setErr(null);
    try {
      const id = await submitScopeRequest(d.project.id, { types, description: description.trim(), goal, priority, timing: timingText || 'Flexible' }) as string;
      try { sessionStorage.removeItem('embed_brief'); } catch { /* storage off */ }
      await celebrate('Scope added', 'scope', 'quote by ' + quoteEta());
      await refresh();
      toast('We’ll email you when the quote is ready.');
      onDone(id);
    } catch (e2) { setErr((e2 as Error).message); }
    setBusy(false);
  };

  return (
    <form className="card stack split-detail" style={{ gap: 20 }} onSubmit={submit}>
      <div className="section-head"><span className="eyebrow"><Meta parts={['New scope', d.project.name]} /></span><button type="button" className="link" onClick={() => onDone()}>Cancel</button></div>
      <h2 style={{ fontSize: 30 }}>What do you need?</h2>
      <div className="chips" role="group" aria-label="Type of work">
        {TYPES.map(t => <button type="button" key={t} className="chip" aria-pressed={types.includes(t)} onClick={() => { setTypes(x => x.includes(t) ? x.filter(y => y !== t) : [...x, t]); setErr(null); }}>{t}</button>)}
      </div>
      <label className="field"><span>Describe it</span><textarea rows={5} value={description} onChange={e => { setDescription(e.target.value); setErr(null); }} placeholder="e.g. Add a referral screen so users can invite friends and see rewards earned." /></label>
      <label className="field"><span>What should it achieve? (optional)</span><textarea rows={2} value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Lift activation from 31% to 40% in Q1." /></label>
      <div className="field"><span>Priority</span>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>{PRIOS.map(p => <button type="button" key={p} aria-pressed={priority === p} onClick={() => setPriority(p)}>{p}</button>)}</div>
      </div>
      <div className="field"><span>When do you need it?</span>
        <div className="stack" style={{ gap: 6 }}>
          {WHENS.map(w => <button type="button" key={w.name} className="choice" aria-pressed={timing === w.name} onClick={() => setTiming(w.name)}><span><b style={{ fontWeight: 500 }}>{w.name}</b><small>{w.sub}</small></span><i /></button>)}
          <div className={'choice choice-x'} aria-pressed={timing === 'By a date'} role="button" tabIndex={0} onClick={() => setTiming('By a date')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setTiming('By a date'); }}>
            <span><b style={{ fontWeight: 500 }}>By a specific date</b><small>Tell us the day it has to be ready</small>
              {timing === 'By a date' && <input type="date" className="choice-input" min={today} value={byDate} aria-label="Needed by" onClick={e => e.stopPropagation()} onChange={e => { setByDate(e.target.value); setErr(null); }} />}
            </span><i />
          </div>
          <div className={'choice choice-x'} aria-pressed={timing === 'Within a set time'} role="button" tabIndex={0} onClick={() => setTiming('Within a set time')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setTiming('Within a set time'); }}>
            <span><b style={{ fontWeight: 500 }}>Within a set time</b><small>A number of weeks or months from now</small>
              {timing === 'Within a set time' && <span className="choice-row" onClick={e => e.stopPropagation()}>
                <input type="number" min={1} max={52} inputMode="numeric" className="choice-input" style={{ width: 90 }} value={within.n} placeholder="6" aria-label="How many" onChange={e => { setWithin(w => ({ ...w, n: e.target.value })); setErr(null); }} />
                <span className="seg">{['weeks', 'months'].map(u => <button type="button" key={u} aria-pressed={within.unit === u} onClick={() => setWithin(w => ({ ...w, unit: u }))}>{u}</button>)}</span>
              </span>}
            </span><i />
          </div>
        </div>
      </div>
      <div className="notice"><b>What happens next:</b> Embed reviews it and sends a fixed-price quote here by <b>{quoteEta()}</b>. Nothing is billed until you accept.</div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions"><button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Add scope'}</button></div>
    </form>
  );
}

export default function ScopePage() {
  return <Suspense><Scope /></Suspense>;
}
