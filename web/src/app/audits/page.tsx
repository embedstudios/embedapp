'use client';

import { useApp } from '@/components/AppProvider';
import { Empty, Meta, Pill, Tag, type Tone } from '@/components/ui';
import type { Audit } from '@/lib/data';

/* The audit tool lives on the studio site; reports open there (they are private links). */
const AUDIT_SITE = 'https://embed.design';
const STATUS: Record<Audit['status'], [string, Tone]> = {
  collecting: ['First look running', 'info'],
  first_look: ['First look', 'mute'],
  auditing: ['Full audit running', 'info'],
  ready: ['Report ready', 'good'],
  delayed: ['Taking longer', 'warn'],
};
const KIND: Record<Audit['kind'], string> = { url: 'Website', app: 'App listing', screens: 'Uploaded screens', figma: 'Figma file' };
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const host = (u: string) => { try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch { return u; } };

export default function Audits() {
  const { detail, profile } = useApp();
  const d = detail!;
  const list = d.audits;
  const ready = list.filter(a => a.status === 'ready' && a.overall != null);
  const latest = ready[0] || null;
  const startUrl = AUDIT_SITE + '/audit/start' + (d.project.website ? '?url=' + encodeURIComponent(d.project.website) : '');
  const site = d.project.website ? host(d.project.website) : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Audits</h1>
          <p>Every audit of your product by Embed’s audit engine, with its scores and the report. The first look is free and takes about two minutes; the full audit arrives within two hours.</p>
        </div>
        <a className="btn" href={startUrl} target="_blank" rel="noopener">{site ? 'Audit ' + site : 'Get your free first look'}</a>
      </div>

      {list.length > 0 && (
        <div className="stats">
          <div className="stat"><span className="eyebrow">Latest score</span><strong>{latest ? latest.overall + ' / 100' : '—'}</strong><small>{latest ? (latest.name || host(latest.target) || KIND[latest.kind]) + ', ' + when(latest.readyAt || latest.createdAt) : 'No full report yet'}</small></div>
          <div className="stat"><span className="eyebrow">Audits</span><strong>{list.length}</strong><small>{ready.length} full {ready.length === 1 ? 'report' : 'reports'}, {list.length - ready.length} first {list.length - ready.length === 1 ? 'look' : 'looks'}</small></div>
          <div className="stat"><span className="eyebrow">Last run</span><strong>{new Date(list[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</strong><small>{host(list[0].target) || KIND[list[0].kind]}, {new Date(list[0].createdAt).getFullYear()}</small></div>
        </div>
      )}

      {list.length ? (
        <div className="card card-flush audits-list">
          <table className="table">
            <thead><tr><th>Audited</th><th>Date</th><th>Status</th><th>Score</th><th /></tr></thead>
            <tbody>
              {list.map((a, k) => {
                const [label, tone] = STATUS[a.status];
                return (
                  <tr key={a.token} style={{ animation: `up .45s var(--ease) ${k * 60}ms both` }}>
                    <td><b style={{ fontWeight: 500 }}>{a.name || host(a.target) || KIND[a.kind]}</b><small><Meta parts={[KIND[a.kind], a.reaudit && 'Re-audit', a.findings != null && a.findings + ' findings']} /></small></td>
                    <td className="mono" data-label="Date">{when(a.readyAt || a.createdAt)}</td>
                    <td data-label="Status"><Pill tone={tone}>{label}</Pill></td>
                    <td className="mono" data-label="Score">{a.overall != null ? a.overall + ' / 100' : '—'}</td>
                    <td className="audits-act" style={{ textAlign: 'right' }}>
                      {a.status === 'ready' ? <a className="btn btn-sm" href={a.reportUrl} target="_blank" rel="noopener">Open report</a>
                        : a.status === 'first_look' ? <a className="btn btn-sm btn-ghost" href={a.reportUrl} target="_blank" rel="noopener">See the first look</a>
                        : <a className="link" href={a.reportUrl} target="_blank" rel="noopener">Follow progress</a>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No audits yet">
          Share a link to your website, app or prototype and Embed’s audit engine looks at it across nine areas: what to fix first, with the evidence beside each finding. Your audits appear here once they run.
        </Empty>
      )}

      <div className="card stack" style={{ gap: 12 }}>
        <Tag tag="how-it-works" />
        <ol className="stack" style={{ gap: 8, margin: 0, paddingLeft: 18, fontSize: 14 }}>
          <li><b>Start</b> with the free first look{site ? <> of <b>{site}</b></> : null}: scores across nine areas and the three issues that matter most, in about two minutes.</li>
          <li><b>Unlock</b> the full audit if it’s useful: every finding with its evidence, fix and effort, attention maps, and a roadmap your team can start on.</li>
          <li><b>Re-audit</b> after your fixes at a lower price, from the report page, and watch the score move.</li>
        </ol>
        <p className="hint" style={{ margin: 0 }}>Use <b>{profile?.email}</b> when you start an audit and it shows up here as soon as the first look is ready. Audits by anyone else on this project appear here too.</p>
      </div>
    </div>
  );
}
