export type Currency = 'INR' | 'USD';

// Indicative FX used for display only; invoices settle in the contract currency.
export const RATE = 83.3;

export const fmtINR = (n: number) => {
  const s = String(Math.round(n));
  if (s.length <= 3) return '₹' + s;
  const last = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return '₹' + rest + ',' + last;
};
export const fmtUSD = (inr: number) => '$' + Math.round(inr / RATE).toLocaleString('en-US');
export const money = (inr: number, cur: Currency) => (cur === 'INR' ? fmtINR(inr) : fmtUSD(inr));
export const moneyAlt = (inr: number, cur: Currency) => (cur === 'INR' ? fmtUSD(inr) : fmtINR(inr));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY = 86400000;

const toDate = (d: string | Date) => (typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00' : d) : d);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysUntil = (d: string | Date) => Math.round((startOfDay(toDate(d)).getTime() - startOfDay(new Date()).getTime()) / DAY);
const pad = (n: number) => String(n).padStart(2, '0');

/** "12 Dec" */
export const dayMonth = (d: string | Date) => { const x = toDate(d); return x.getDate() + ' ' + MONTHS[x.getMonth()]; };
/** "Wed" */
export const weekday = (d: string | Date) => DAYS[toDate(d).getDay()];
/** "due in 2d" / "due today" / "overdue" */
export const dueIn = (d: string | null) => {
  if (!d) return '';
  const n = daysUntil(d);
  return n > 1 ? `due in ${n}d` : n === 1 ? 'due tomorrow' : n === 0 ? 'due today' : 'overdue';
};
/** "today" / "21 Oct" */
export const decidedOn = (d: string | null) => (!d ? '' : daysUntil(d) === 0 ? 'today' : dayMonth(d));
/** "Week 11 of 16" */
export const weekLabel = (start: string | null, due: string | null) => {
  if (!start || !due) return 'Proposal';
  const total = Math.max(1, Math.round((toDate(due).getTime() - toDate(start).getTime()) / (7 * DAY)));
  const now = Math.min(total, Math.max(1, Math.floor(-daysUntil(start) / 7) + 1));
  return `Week ${now} of ${total}`;
};
/** Chat meta time: "now", "14:02", "Tue 11:20", "12 Oct" */
export const msgTime = (iso: string) => {
  const d = toDate(iso), ago = Date.now() - d.getTime(), days = -daysUntil(d);
  if (ago < 60000) return 'now';
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  if (days === 0) return hm;
  if (days < 7) return weekday(d) + ' ' + hm;
  return dayMonth(d);
};
/** Next working day at 10:00 — the in-app quote promise, e.g. "Thu 10:00". */
export const quoteEta = (from = new Date()) => {
  const d = new Date(from);
  do d.setDate(d.getDate() + 1); while (d.getDay() === 0 || d.getDay() === 6);
  return weekday(d) + ' 10:00';
};
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
