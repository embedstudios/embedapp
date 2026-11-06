// Live exchange rates for display. Invoices keep their own currency and amount
// (a $300 invoice is $300); only converted figures use these rates, and the
// page says so. Rates come from open.er-api.com (daily, no key), cached for the
// session; if that can't be reached, an indicative fallback is used and labelled.

export type Fx = { rates: Record<string, number>; asOf: string; live: boolean };

const FALLBACK: Fx = { rates: { USD: 1, INR: 83.3 }, asOf: '', live: false };
const KEY = 'embed_fx_v1';
const TTL = 6 * 3600e3;
let fx: Fx = FALLBACK;
let pending: Promise<Fx> | null = null;

export const getFx = () => fx;

export function loadFx(): Promise<Fx> {
  if (pending) return pending;
  pending = (async () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.at < TTL && c.rates && c.rates.INR > 0) { fx = { rates: c.rates, asOf: c.asOf, live: true }; return fx; }
    } catch { /* no storage */ }
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
      const d = await r.json();
      if (d && d.result === 'success' && d.rates && d.rates.INR > 0) {
        fx = { rates: d.rates, asOf: String(d.time_last_update_utc || ''), live: true };
        try { sessionStorage.setItem(KEY, JSON.stringify({ rates: fx.rates, asOf: fx.asOf, at: Date.now() })); } catch { /* fine */ }
      }
    } catch { /* keep the fallback */ }
    return fx;
  })();
  return pending;
}

/** amount in `from` → `to` at the current rates; null if a rate is missing. */
export function convert(amount: number, from: string, to: string): number | null {
  if (from === to) return amount;
  const a = fx.rates[from], b = fx.rates[to];
  return a > 0 && b > 0 ? (amount / a) * b : null;
}

/** "$1 = ₹84.12, today's rate" or "indicative rate ₹83.3 = $1". */
export function rateNote() {
  const inr = fx.rates.INR;
  const r = '$1 = ₹' + (Math.round(inr * 100) / 100).toLocaleString('en-IN');
  if (!fx.live) return 'At an indicative ' + r;
  const d = fx.asOf ? new Date(fx.asOf) : null;
  return 'At today’s rate, ' + r + (d && !isNaN(d.getTime()) ? ' (' + d.getDate() + ' ' + d.toLocaleString('en-GB', { month: 'short' }) + ')' : '');
}
