'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Empty, Meta, Pill, Tag, type Tone } from '@/components/ui';
import { addTodo, commentTodo, subscribeRetainer, todoAction, type Todo } from '@/lib/data';
import { dayMonth, msgTime } from '@/lib/format';
import { dur, isRetainer, TODO_LABEL } from '@/lib/retainer';

const TONE: Record<Todo['status'], Tone> = { open: 'mute', progress: 'info', review: 'mint', done: 'good' };
const FILTERS = [['active', 'Active'], ['review', 'Ready for you'], ['done', 'Done']] as const;

function Todos() {
  const { detail, refresh } = useApp();
  const d = detail!;
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const composing = params.get('new') === '1';
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>('active');
  useEffect(() => subscribeRetainer(d.project.id, () => { refresh(); }), [d.project.id]);

  if (!isRetainer(d)) return <div className="page"><Empty title="No to-dos on this project">To-dos are for retainer work.</Empty></div>;
  const of = (k: string) => d.todos.filter(t => (k === 'active' ? t.status === 'open' || t.status === 'progress' : t.status === k));
  const list = of(filter);
  const selected = d.todos.find(t => t.id === id) || (!composing ? of('review')[0] || list[0] : null) || null;
  const go = (q: string) => router.replace('/todos/' + q, { scroll: false });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>To-dos</h1>
          <p>Add anything you need from the team, any day. Embed picks it up, keeps you posted here, and sends it back for you to check.</p>
        </div>
        <button className="btn" onClick={() => go('?new=1')}>Add a to-do</button>
      </div>
      <div className="split">
        <div className="stack" style={{ gap: 14 }}>
          <span className="seg seg-wide">{FILTERS.map(([k, v]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{v}{of(k).length ? ' ' + of(k).length : ''}</button>)}</span>
          {list.length ? (
            <div className="card card-flush">
              {list.map((t, i) => (
                <button key={t.id} className="row" aria-current={!composing && selected?.id === t.id} onClick={() => go('?id=' + t.id)} style={{ animation: `up .45s var(--ease) ${i * 40}ms both` }}>
                  <span className={'tick ' + (t.status === 'done' ? 'done' : t.status === 'review' ? 'review' : t.status === 'progress' ? 'progress' : '')}>{t.status === 'done' ? '✓' : ''}</span>
                  <span className="grow"><strong>{t.title}</strong><small><Meta parts={[t.ref, t.priority === 'urgent' && 'urgent', t.dueOn && 'by ' + dayMonth(t.dueOn), t.comments.length > 0 && t.comments.length + (t.comments.length === 1 ? ' comment' : ' comments')]} /></small></span>
                  {t.status === 'review' ? <Pill tone="mint">Check it</Pill> : <Pill tone={TONE[t.status]}>{TODO_LABEL[t.status]}</Pill>}
                </button>
              ))}
            </div>
          ) : <div className="empty" style={{ padding: 24 }}><Tag tag="inbox-zero">{filter === 'review' ? 'Nothing waiting for you to check' : filter === 'done' ? 'Nothing done yet' : 'No open to-dos'}</Tag></div>}
          <div className="card stack" style={{ gap: 12 }}>
            <Tag tag="how-it-works" />
            <ol className="stack" style={{ gap: 8, margin: 0, paddingLeft: 18, fontSize: 14 }}>
              <li><b>Add</b> what you need. Mark it urgent if it can’t wait.</li>
              <li><b>Embed</b> picks it up, comments here and logs the time it takes.</li>
              <li><b>Check</b> it when it’s ready: mark it done, or send it back with a note.</li>
            </ol>
          </div>
        </div>
        {composing ? <TodoForm onDone={newId => go(newId ? '?id=' + newId : '')} /> : selected ? <TodoDetail key={selected.id} t={selected} /> : null}
      </div>
    </div>
  );
}

function TodoDetail({ t }: { t: Todo }) {
  const { detail, profile, refresh, toast, celebrate } = useApp();
  const d = detail!;
  const [draft, setDraft] = useState('');
  const [back, setBack] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [t.comments.length]);
  const mins = d.time.filter(e => e.todoId === t.id && !e.running).reduce((n, e) => n + e.minutes, 0);
  const working = d.time.filter(e => e.todoId === t.id && e.running);
  const act = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { await fn(); await refresh(); if (ok) toast(ok); }
    catch (e) { toast((e as Error).message === "can't withdraw" ? 'Only an open to-do you added can be withdrawn.' : 'That didn’t go through. Try again.'); }
    setBusy(false);
  };
  const comment = () => { const b = draft.trim(); if (!b) return; setDraft(''); act(() => commentTodo(d.project.id, t.id, b)); };
  return (
    <article className="card stack split-detail" style={{ gap: 16 }}>
      <div className="section-head"><span className="eyebrow"><Meta parts={[t.ref, t.fromClient ? 'added by ' + (t.createdBy === profile?.id ? 'you' : t.byName) : 'added by Embed', msgTime(t.createdAt)]} /></span><Pill tone={TONE[t.status]}>{TODO_LABEL[t.status]}</Pill></div>
      <h2 style={{ fontSize: 26 }}>{t.title}</h2>
      {t.details && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{t.details}</p>}
      <p className="hint"><Meta parts={[t.priority === 'urgent' && 'Urgent', t.dueOn && 'Wanted by ' + dayMonth(t.dueOn), mins > 0 && dur(mins) + ' logged', working.length > 0 && working.map(e => e.personName).join(', ') + ' on it now']} /></p>
      {t.status === 'review' && (
        <div className="callout stack" style={{ gap: 10 }}>
          <strong>Ready for you to check</strong>
          {back === null ? (
            <div className="actions">
              <button className="btn" disabled={busy} onClick={() => act(async () => { await todoAction(t.id, 'approve'); await celebrate('Done', 'signed-off', t.ref + ' ' + t.title); })}>Mark done</button>
              <button className="btn btn-quiet" disabled={busy} onClick={() => setBack('')}>Send back</button>
            </div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              <label className="field"><span>What needs changing?</span><textarea rows={3} value={back} onChange={e => setBack(e.target.value)} autoFocus /></label>
              <div className="actions">
                <button className="btn" disabled={busy || back.trim().length < 3} onClick={() => act(() => todoAction(t.id, 'reopen', back.trim()), 'Sent back to the team.').then(() => setBack(null))}>Send back</button>
                <button className="link" onClick={() => setBack(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">Comments</span>
        {t.comments.length ? t.comments.map(c => (
          <div key={c.id} className={'bubble' + (c.fromClient ? ' me' : '')}><p>{c.body}</p><small><Meta parts={[c.authorId === profile?.id ? 'You' : c.authorName, msgTime(c.createdAt)]} /></small></div>
        )) : <p className="hint">No comments yet. Add details, links or questions for the team.</p>}
        <div ref={end} />
        <div className="composer" style={{ padding: 0, border: 0 }}>
          <textarea rows={1} value={draft} placeholder="Write a comment" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); comment(); } }} />
          <button className="btn btn-sm" disabled={busy || !draft.trim()} onClick={comment}>Send</button>
        </div>
      </div>
      {t.status === 'open' && t.createdBy === profile?.id && <button className="link" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => { if (confirm('Withdraw ' + t.ref + '? The team hasn’t started it.')) act(() => todoAction(t.id, 'withdraw'), 'Withdrawn.'); }}>Withdraw this to-do</button>}
    </article>
  );
}

function TodoForm({ onDone }: { onDone: (id?: string) => void }) {
  const { detail, refresh, toast } = useApp();
  const d = detail!;
  const [f, setF] = useState({ title: '', details: '', priority: 'normal' as 'normal' | 'urgent', dueOn: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 3 || busy) return;
    setBusy(true);
    try { const id = await addTodo(d.project.id, f); await refresh(); toast('Added. The team has been told.'); onDone(id); }
    catch { toast('Couldn’t add it. Try again.'); setBusy(false); }
  };
  return (
    <form className="card stack split-detail" style={{ gap: 18 }} onSubmit={submit}>
      <h2 style={{ fontSize: 26 }}>Add a to-do</h2>
      <label className="field"><span>What do you need?</span><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Update the homepage banner for the November offer" autoFocus /></label>
      <label className="field"><span>Details (optional)</span><textarea rows={4} value={f.details} onChange={e => setF({ ...f, details: e.target.value })} placeholder="Copy, links, where it goes, anything the team should know." /></label>
      <div className="field"><span>Priority</span><div className="chips">{(['normal', 'urgent'] as const).map(p => <button type="button" key={p} className="chip" aria-pressed={f.priority === p} onClick={() => setF({ ...f, priority: p })}>{p === 'normal' ? 'Normal' : 'Urgent'}</button>)}</div></div>
      <label className="field"><span>Wanted by (optional)</span><input type="date" value={f.dueOn} onChange={e => setF({ ...f, dueOn: e.target.value })} /></label>
      <div className="actions"><button className="btn" disabled={busy || f.title.trim().length < 3}>{busy ? 'Adding…' : 'Add to-do'}</button><button type="button" className="link" onClick={() => onDone()}>Cancel</button></div>
    </form>
  );
}

export default function Page() { return <Suspense><Todos /></Suspense>; }
