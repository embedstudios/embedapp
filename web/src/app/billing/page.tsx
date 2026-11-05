'use client';

import { useApp } from '@/components/AppProvider';
import { Empty, Pill } from '@/components/ui';
import { dayMonth, fmtINR, fmtUSD, money } from '@/lib/format';

export default function Billing() {
  const { detail, cur, setCur } = useApp();
  const d = detail!;
  const paid = d.invoices.filter(i => i.status === 'paid').reduce((n, i) => n + i.amountInr, 0);
  const open = d.invoices.filter(i => i.status !== 'paid').reduce((n, i) => n + i.amountInr, 0);
  const today = new Date().toISOString().slice(0, 10);
  /* Invoices in another currency show their own amount; the totals add up in INR. */
  const own = (amount: number | null, c: string, inr: number) => c && c !== 'INR' && amount != null
    ? (c === 'USD' ? '$' + Math.round(amount).toLocaleString('en-US') : c + ' ' + amount.toLocaleString('en-IN'))
    : cur === 'INR' ? fmtINR(inr) : fmtUSD(inr);

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
        <div className="stat"><span className="eyebrow">Paid to date</span><strong>{money(paid, cur)}</strong></div>
        <div className="stat"><span className="eyebrow">Outstanding</span><strong style={{ color: open > 0 ? 'var(--warn)' : undefined }}>{money(open, cur)}</strong></div>
        <div className="stat"><span className="eyebrow">Contract</span><strong>{d.project.contractInr ? money(d.project.contractInr, cur) : '—'}</strong><small>{cur === 'USD' ? 'Indicative rate ₹83.3 = $1' : 'Before taxes'}</small></div>
      </div>
      {d.invoices.length ? (
        <div className="card card-flush scroll-x">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
            <tbody>
              {d.invoices.map((i, k) => {
                const late = i.status === 'due' && !!i.dueOn && i.dueOn < today;
                return (
                  <tr key={i.id} style={{ animation: `up .45s var(--ease) ${k * 60}ms both` }}>
                    <td><b style={{ fontWeight: 500 }}>{i.title}</b><small>{i.ref}</small></td>
                    <td className="mono">{own(i.amount, i.currency, i.amountInr)}</td>
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
      ) : <Empty title="No invoices yet">Milestone invoices appear here as soon as they’re sent.</Empty>}
      <p className="hint">Questions about an invoice? Write to <b>hello@embed.design</b> or message the team.</p>
    </div>
  );
}
