'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useApp } from '@/components/AppProvider';
import { Empty, Pill, Tag, type Tone } from '@/components/ui';
import { PHASE_NAMES, PHASES, type PhaseKey } from '@/lib/data';

const STATUS: Record<string, [string, Tone]> = { done: ['Done', 'good'], review: ['In review', 'mint'], progress: ['In progress', 'info'], upcoming: ['Upcoming', 'mute'] };

function Phases() {
  const { detail } = useApp();
  const d = detail!;
  const q = useSearchParams().get('phase') as PhaseKey | null;
  const cur = PHASES.indexOf(d.project.currentPhase);
  const key: PhaseKey = q && PHASES.includes(q) ? q : d.project.currentPhase;
  const idx = PHASES.indexOf(key);
  const phase = d.phases.find(p => p.key === key);
  const items = d.deliverables.filter(x => x.phase === key);
  const files = d.files.filter(x => x.phase === key);
  const state = d.project.status === 'proposal' ? 'Not started' : idx < cur ? 'Complete' : idx === cur ? 'In progress' : 'Upcoming';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Phases &amp; files</h1>
          <p>Embed’s process: research the problem, set the strategy, explore ideas, design it, then hand it over to your engineers.</p>
        </div>
      </div>
      <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
        {PHASES.map((k, i) => (
          <Link key={k} href={'/phases/?phase=' + k} role="tab" aria-selected={k === key} className="seg-link" style={{ padding: '6px 16px', borderRadius: 999, textDecoration: 'none', fontSize: 13, fontWeight: 600, background: k === key ? 'var(--tx)' : 'transparent', color: k === key ? 'var(--bg)' : 'var(--mu)' }}>
            {i + 1}. {PHASE_NAMES[k]}
          </Link>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div className="ghost-num" aria-hidden="true">0{idx + 1}</div>
        <Tag tag={'phase ' + String(idx + 1).padStart(2, '0') + '/05'}>{state}</Tag>
        <h2 style={{ fontSize: 34, marginTop: 6, position: 'relative' }}>{PHASE_NAMES[key]}{phase?.nowLabel && idx === cur ? <span className="muted" style={{ fontSize: 20 }}> — {phase.nowLabel}</span> : null}</h2>
        {phase?.blurb && <p className="muted" style={{ maxWidth: '62ch', position: 'relative' }}>{phase.blurb}</p>}
      </div>

      <div className="cols">
        <section className="section">
          <span className="eyebrow">Deliverables</span>
          {items.length ? (
            <div className="card card-flush">
              {items.map((x, i) => {
                const [label, tone] = STATUS[x.status] || STATUS.upcoming;
                const inner = (
                  <>
                    <span className={'tick ' + x.status}>{x.status === 'done' ? '✓' : ''}</span>
                    <span className="grow"><strong>{x.name}</strong><small>{x.note}</small></span>
                    <Pill tone={tone}>{label}</Pill>
                  </>
                );
                const style = { animation: `up .45s var(--ease) ${i * 60}ms both` };
                return x.status === 'review' && x.approvalId
                  ? <Link key={x.id} href={'/approvals/?id=' + x.approvalId} className="row" style={style}>{inner}</Link>
                  : <div key={x.id} className="row" style={style}>{inner}</div>;
              })}
            </div>
          ) : <Empty title="Nothing planned here yet">Your project lead adds this phase’s deliverables as it gets closer.</Empty>}
        </section>
        <aside className="section">
          <span className="eyebrow">Files</span>
          {files.length ? (
            <div className="card card-flush">
              {files.map(f => (
                <a key={f.id} className="row" href={f.url || undefined} target="_blank" rel="noopener" aria-disabled={!f.url}>
                  <span className="pill" style={{ minWidth: 44, justifyContent: 'center' }}>{f.ext}</span>
                  <span className="grow"><strong>{f.name}</strong><small>{f.meta}</small></span>
                  {f.url && <span className="link">Open ↗</span>}
                </a>
              ))}
            </div>
          ) : <Empty title="No files yet">Research reports, Figma files and prototypes appear here as they’re shared.</Empty>}
        </aside>
      </div>
    </div>
  );
}

export default function PhasesPage() {
  return <Suspense><Phases /></Suspense>;
}
