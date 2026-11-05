'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Meta, Pill, Tag } from '@/components/ui';
import { PHASE_NAMES, PHASES } from '@/lib/data';
import { dayMonth, dueIn, greeting, money, weekday, weekLabel } from '@/lib/format';

/** Eased count-up to a number, replayed when it changes. */
function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

export default function Overview() {
  const { detail, profile, cur } = useApp();
  const d = detail!;
  const p = d.project;
  const proposal = p.status === 'proposal';
  const pct = useCountUp(proposal ? 0 : p.progress);
  const curIdx = PHASES.indexOf(p.currentPhase);
  const curPhase = d.phases.find(x => x.key === p.currentPhase);
  const first = profile?.fullName.split(' ')[0];

  const pending = d.approvals.filter(a => a.status === 'pending');
  const quoted = d.requests.filter(r => r.status === 'quoted');
  const due = d.invoices.filter(i => i.status === 'due');
  const needs = [
    ...pending.map(a => ({ key: a.id, href: '/approvals/?id=' + a.id, title: a.title, sub: <Meta parts={[a.kind, a.meta]} />, right: dueIn(a.dueOn), urgent: !!a.dueOn && Date.parse(a.dueOn) - Date.now() < 3 * 864e5, label: 'Approve' })),
    ...quoted.map(r => ({ key: r.id, href: '/scope/?id=' + r.id, title: 'Quote ready: ' + r.title, sub: <Meta parts={[money(r.priceInr || 0, cur), r.timeline]} />, right: r.validUntil ? 'valid to ' + dayMonth(r.validUntil) : '', urgent: false, label: 'Review' })),
    ...due.map(i => ({ key: i.id, href: '/billing/', title: i.title, sub: <Meta parts={[i.ref, money(i.amountInr, cur)]} />, right: i.dueOn ? 'due ' + dayMonth(i.dueOn) : '', urgent: !!i.dueOn && i.dueOn < new Date().toISOString().slice(0, 10), label: 'Pay' })),
  ];
  const paid = d.invoices.filter(i => i.status === 'paid').reduce((n, i) => n + i.amountInr, 0);
  const done = d.deliverables.filter(x => x.status === 'done').length;

  return (
    <div className="page">
      <div className="hero">
        <Tag tag="hi">{greeting()}{first ? ', ' + first : ''}</Tag>
        <span className="eyebrow"><Meta parts={[weekLabel(p.startOn, p.dueOn), 'due ' + (p.dueOn ? dayMonth(p.dueOn) : 'TBC'), 'lead ' + p.leadName]} /></span>
        <h1>{p.subtitle || p.name}</h1>
      </div>

      {proposal ? (
        <div className="card stack">
          <span className="eyebrow">Before Phase 1</span>
          <h3>Brief received — we’re preparing your proposal</h3>
          <div className="stack" style={{ gap: 10 }}>
            <div className="actions"><span className="tick done">✓</span><Meta parts={['Brief sent', p.budgetLabel, p.timing]} /></div>
            <div className="actions"><span className="tick progress" />Embed books a 30-min discovery call</div>
            <div className="actions muted"><span className="tick" />Fixed-price proposal here within 3 working days</div>
          </div>
          <p className="hint">Then: Research → Strategy → Ideation → Design → Handover</p>
        </div>
      ) : (
        <div className="card stack" style={{ gap: 18 }}>
          <div className="section-head">
            <span className="eyebrow"><Meta parts={['Phase ' + (curIdx + 1) + ' of 5', p.status === 'complete' && 'complete']} /></span>
            <span className="pct">{Math.round(pct)}<small>%</small></span>
          </div>
          <div className="rail" role="list">
            {PHASES.map((k, i) => {
              const fill = i < curIdx ? 100 : i === curIdx ? Math.min(100, Math.max(8, Math.round(((p.progress / 100) * 5 - curIdx) * 100))) : 0;
              return (
                <Link key={k} href={'/phases/?phase=' + k} role="listitem" aria-label={PHASE_NAMES[k] + (i < curIdx ? ', complete' : i === curIdx ? ', current' : ', upcoming')}>
                  <span className="bar"><i className={i < curIdx ? 'past' : i === curIdx ? 'now' : ''} style={{ width: fill + '%', animationDelay: 120 + i * 90 + 'ms' }} /></span>
                  <span className={i > curIdx ? 'later' : ''}>{PHASE_NAMES[k]}</span>
                </Link>
              );
            })}
          </div>
          <Link href={'/phases/?phase=' + p.currentPhase} className="row" style={{ padding: '14px 0 0', borderTop: '1px solid var(--ln2)' }}>
            <span className="grow"><strong>Now: {PHASE_NAMES[p.currentPhase]}{curPhase?.nowLabel ? ' — ' + curPhase.nowLabel : ''}</strong><small>{p.phaseSummary}</small></span>
            <span className="link">See deliverables</span>
          </Link>
        </div>
      )}

      <div className="stats">
        <div className="stat"><span className="eyebrow">Deliverables</span><strong>{done}<small className="muted" style={{ fontSize: 16 }}> / {d.deliverables.length}</small></strong><small>signed off or delivered</small></div>
        <div className="stat"><span className="eyebrow">Waiting on you</span><strong>{needs.length}</strong><small><Meta parts={[pending.length + ' approval' + (pending.length === 1 ? '' : 's'), quoted.length + ' quote' + (quoted.length === 1 ? '' : 's'), due.length + ' invoice' + (due.length === 1 ? '' : 's')]} /></small></div>
        <div className="stat"><span className="eyebrow">Paid to date</span><strong>{money(paid, cur)}</strong><small>{p.contractInr ? 'of ' + money(p.contractInr, cur) + ' contract' : 'see Billing'}</small></div>
      </div>

      <div className="cols">
        <div className="stack" style={{ gap: 28 }}>
          <section className="section">
            <div className="section-head">
              <Tag tag="needs-you" attr={<> count=&quot;<b>{needs.length}</b>&quot;</>} />
              {pending.length > 0 && <Link className="link" href="/approvals/">All approvals</Link>}
            </div>
            {needs.length ? (
              <div className="card card-flush">
                {needs.map((n, i) => (
                  <Link key={n.key} href={n.href} className="row" style={{ animation: `up .45s var(--ease) ${i * 60}ms both` }}>
                    <span className="dot" />
                    <span className="grow"><strong>{n.title}</strong><small>{n.sub}</small></span>
                    {n.right && <span className="mono" style={{ fontSize: 12, color: n.urgent ? 'var(--warn)' : 'var(--mu)' }}>{n.right}</span>}
                    <Pill tone="mint">{n.label}</Pill>
                  </Link>
                ))}
              </div>
            ) : <div className="empty"><strong>Nothing waiting on you</strong><p>New approvals, quotes and invoices show up here first.</p></div>}
          </section>

          <section className="section">
            <span className="tag">{'<this-week>'}</span>
            <div className="card card-flush">
              {d.activity.slice(0, 8).map((e, i) => (
                <div key={e.id} className="row" style={{ animation: `up .45s var(--ease) ${200 + i * 50}ms both` }}>
                  <span className="mono muted" style={{ width: 40, fontSize: 12 }}>{weekday(e.createdAt)}</span>
                  <span className="grow"><strong style={{ fontWeight: 400 }}>{e.body}</strong><small>{e.actorName === profile?.fullName ? 'You' : e.actorName}</small></span>
                </div>
              ))}
              {!d.activity.length && <div className="row"><span className="grow muted">No updates yet.</span></div>}
            </div>
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <div className="card stack" style={{ gap: 12 }}>
            <span className="eyebrow">Your Embed team</span>
            {d.team.map(t => (
              <div key={t.id} className="actions">
                <span className="side-initial" style={{ width: 32, height: 32, fontSize: 13, background: 'var(--sf2)', color: 'var(--tx)' }}>{t.name[0]}</span>
                <span><strong style={{ fontWeight: 500 }}>{t.name}</strong><br /><small className="muted">{t.role}</small></span>
              </div>
            ))}
            <Link href="/messages/" className="btn btn-quiet btn-sm">Message the team</Link>
          </div>
          <div className="card stack" style={{ gap: 10 }}>
            <span className="eyebrow">Need something new?</span>
            <p className="hint">Add a new scope and get a fixed-price quote here within one working day.</p>
            <Link href="/scope/?new=1" className="btn btn-sm">Add a new scope</Link>
          </div>
          {d.files.length > 0 && (
            <div className="card stack" style={{ gap: 8 }}>
              <span className="eyebrow">Latest files</span>
              {d.files.slice(-3).reverse().map(f => (
                <a key={f.id} href={f.url || undefined} target="_blank" rel="noopener" className="actions" style={{ textDecoration: 'none' }}>
                  <span className="pill">{f.ext}</span><span className="grow">{f.name}<br /><small className="muted">{f.meta}</small></span>
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
