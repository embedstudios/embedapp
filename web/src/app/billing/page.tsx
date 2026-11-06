'use client';

import { useApp } from '@/components/AppProvider';
import { Empty, Pill } from '@/components/ui';
import { dayMonth, fmtIn, invoiceIn, invoiceOwn, money } from '@/lib/format';
import { rateNote } from '@/lib/fx';

export default function Billing() {
  const { detail, cur, setCur } = useApp();
  const d = detail!;
  /* Totals add up each invoice's own amount. Only invoices billed in another
     currency are converted, at today's rate, and then the figure says ≈. */
  const sum = (list: typeof d.invoices) => list.reduce((acc, i) => { const v = invoiceIn(i, cur); return { value: acc.value + v.value, exact: acc.exact && v.exact }; }, { value: 0, exact: true });
  const paid = sum(d.invoices.filter(i => i.status === 'paid'));
  const open = sum(d.invoices.filter(i => i.status !== 'paid'));
  const converted = !paid.exact || !open.exact || (cur !== 'INR' && !!d.project.contractInr);
  const today = new Date().toISOString().slice(0, 10);
  const fig = (v: { value: number; exact: boolean }) => (v.exact ? '' : '≈ ') + fmtIn(v.value, cur);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Billing</h1>
          <p>Invoices for {d.project.name}, straight from our books. Pay online from any sent invoice; receipts are emailed when a payment lands.</p>
        </div>
        <span className="seg">{(['INR', 'USD'] as const).map(c => <button key={c} aria-pressed={cur === c} onClick={() => setCur(c)}>{c}</button>)}</span>
      </div>
      <div className="stats">
        <div className="stat"><span className="eyebrow">Paid to date</span><strong>{fig(paid)}</strong></div>
        <div className="stat"><span className="eyebrow">Outstanding</span><strong style={{ color: open.value > 0 ? 'var(--warn)' : undefined }}>{fig(open)}</strong></div>
        <div className="stat"><span className="eyebrow">Contract</span><strong>{d.project.contractInr ? (cur === 'INR' ? '' : '≈ ') + money(d.project.contractInr, cur) : '—'}</strong><small>{d.project.contractInr && cur === 'INR' ? 'Before taxes' : converted ? rateNote() : 'Exact, from your invoices'}</small></div>
      </div>
      {d.invoices.length ? (
        <div className="card card-flush scroll-x">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
            <tbody>
              {d.invoices.map((i, k) => {
                const late = i.status === 'due' && !!i.dueOn && i.dueOn < today;
                const own = invoiceOwn(i), shown = invoiceIn(i, cur);
                return (
                  <tr key={i.id} style={{ animation: `up .45s var(--ease) ${k * 60}ms both` }}>
                    <td><b style={{ fontWeight: 500 }}>{i.title}</b><small>{i.ref}</small></td>
                    <td className="mono">{fmtIn(own.amount, own.currency)}{!shown.exact && <small>≈ {fmtIn(shown.value, cur)}</small>}</td>
                    <td className="mono" style={{ color: late ? 'var(--bad)' : undefined }}>{i.status === 'paid' ? (i.paidOn ? 'paid ' + dayMonth(i.paidOn) : 'paid') : i.dueOn ? dayMonth(i.dueOn) : '—'}</td>
                    <td>{i.status === 'paid' ? <span className="stamp" style={{ animationDelay: 200 + k * 120 + 'ms' }}>PAID</span> : i.status === 'scheduled' ? <Pill>Issued today</Pill> : <Pill tone={late ? 'bad' : 'warn'}>{late ? 'Overdue' : 'Due'}</Pill>}</td>
                    <td style={{ textAlign: 'right' }}>
                      {i.status === 'due' && (i.paymentUrl ? <a className="btn btn-sm" href={i.paymentUrl} target="_blank" rel="noopener">Pay now</a> : <small>Payment link by email</small>)}
                      {i.status === 'paid' && i.paymentUrl && <a className="link" href={i.paymentUrl} target="_blank" rel="noopener">View</a>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No invoices yet">{d.project.engagement === 'retainer' ? 'Monthly retainer invoices appear here as soon as they’re sent.' : 'Milestone invoices appear here as soon as they’re sent.'}</Empty>}
      <p className="hint">{converted ? 'Amounts marked ≈ are converted. ' + rateNote() + '; you pay the invoice’s own amount. ' : ''}Questions about an invoice? Write to <b>hello@embed.design</b> or message the team.</p>
    </div>
  );
}
