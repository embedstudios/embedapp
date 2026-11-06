'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Empty, Meta } from '@/components/ui';
import { subscribeRetainer } from '@/lib/data';
import { dur, hours, istToday, isRetainer, logged, monthName, monthOf, shiftMonth } from '@/lib/retainer';

export default function Timesheet() {
  const { detail, refresh } = useApp();
  const d = detail!;
  const [month, setMonth] = useState(() => monthOf(istToday()));
  useEffect(() => subscribeRetainer(d.project.id, () => { refresh(); }), [d.project.id]);
  if (!isRetainer(d)) return <div className="page"><Empty title="No timesheet on this project">Timesheets are for retainer work.</Empty></div>;

  const todo = Object.fromEntries(d.todos.map(t => [t.id, t]));
  const entries = d.time.filter(e => !e.running && monthOf(e.workOn) === month);
  const billable = logged(d.time, month);
  const other = entries.filter(e => !e.billable).reduce((n, e) => n + e.minutes, 0);
  const cap = d.project.retainerHours ? d.project.retainerHours * 60 : 0;
  const running = d.time.filter(e => e.running);
  const days = [...new Set(entries.map(e => e.workOn))].sort().reverse();
  const byTodo = Object.entries(entries.reduce<Record<string, number>>((o, e) => { const k = e.todoId || ''; o[k] = (o[k] || 0) + e.minutes; return o; }, {})).sort((a, b) => b[1] - a[1]);
  const now = monthOf(istToday());
  const csv = () => {
    const q = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [['Date', 'Person', 'To-do', 'Description', 'Hours', 'Billable'], ...entries.slice().sort((a, b) => (a.workOn < b.workOn ? -1 : 1)).map(e => [e.workOn, e.personName, e.todoId && todo[e.todoId] ? todo[e.todoId].ref + ' ' + todo[e.todoId].title : '', e.description, (e.minutes / 60).toFixed(2), e.billable ? 'Yes' : 'No'])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'timesheet-' + month + '.csv'; a.click();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Timesheet</h1>
          <p>Every hour the Embed team logs on your retainer, by day and by to-do.</p>
        </div>
        <span className="seg">
          <button aria-label="Previous month" onClick={() => setMonth(m => shiftMonth(m, -1))}>‹</button>
          <button aria-pressed="true" style={{ minWidth: 130 }}>{monthName(month)}</button>
          <button aria-label="Next month" disabled={month >= now} onClick={() => setMonth(m => shiftMonth(m, 1))}>›</button>
        </span>
      </div>
      <div className="stats">
        <div className="stat"><span className="eyebrow">Logged</span><strong>{hours(billable)}</strong><small>{other ? hours(other) + ' more not billed' : entries.length + (entries.length === 1 ? ' entry' : ' entries')}</small></div>
        <div className="stat"><span className="eyebrow">Included</span><strong>{cap ? hours(cap) : '—'}</strong>{cap > 0 ? <span className="bar"><i style={{ width: Math.min(100, (billable / cap) * 100) + '%', background: billable > cap ? 'var(--bad)' : undefined }} /></span> : <small>per month</small>}</div>
        <div className="stat"><span className="eyebrow">{cap && billable > cap ? 'Over by' : 'Left this month'}</span><strong style={{ color: cap && billable > cap ? 'var(--bad)' : undefined }}>{cap ? hours(Math.abs(cap - billable)) : '—'}</strong><small>{cap ? Math.round((billable / cap) * 100) + '% used' : 'No set allowance'}</small></div>
      </div>
      {running.length > 0 && month === now && (
        <div className="card card-flush">
          {running.map(e => <div key={e.id} className="row"><span className="dot" /><span className="grow"><strong>{e.personName} is working on {e.todoId && todo[e.todoId] ? todo[e.todoId].ref + ': ' + todo[e.todoId].title : e.description || 'your retainer'}</strong><small>started {e.startedAt ? new Date(e.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</small></span></div>)}
        </div>
      )}
      {!entries.length ? <Empty title={'No time logged in ' + monthName(month)}>Hours show up here as the team logs them.</Empty> : (
        <div className="cols">
          <div className="stack" style={{ gap: 18 }}>
            {days.map(day => {
              const list = entries.filter(e => e.workOn === day);
              return (
                <section key={day} className="section">
                  <div className="section-head"><span className="eyebrow">{new Date(day + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span><span className="mono muted" style={{ fontSize: 12 }}>{dur(list.reduce((n, e) => n + e.minutes, 0))}</span></div>
                  <div className="card card-flush">
                    {list.map(e => (
                      <div key={e.id} className="row">
                        <span className="grow"><strong style={{ fontWeight: 400 }}>{e.description || (e.todoId && todo[e.todoId]?.title) || 'Retainer work'}</strong><small><Meta parts={[e.todoId && todo[e.todoId] && todo[e.todoId].ref, e.personName, !e.billable && 'not billed']} /></small></span>
                        <span className="mono" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{dur(e.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <aside className="stack" style={{ gap: 16 }}>
            <div className="card stack" style={{ gap: 10 }}>
              <span className="eyebrow">By to-do</span>
              {byTodo.map(([k, v]) => <div key={k || 'none'} className="actions" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{k && todo[k] ? todo[k].ref + ': ' + todo[k].title : 'General work'}</span><span className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{dur(v)}</span></div>)}
            </div>
            <button className="btn btn-quiet btn-sm" onClick={csv}>Download CSV</button>
          </aside>
        </div>
      )}
    </div>
  );
}
