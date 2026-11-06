// Retainer helpers shared by the sidebar, Overview, To-dos and Timesheet.
import type { Detail, TimeEntry, Todo } from './data';

export const isRetainer = (d: Detail) => d.project.engagement === 'retainer' || d.project.engagement === 'both';
export const hasPhases = (d: Detail) => d.project.engagement !== 'retainer';

/** Months are the studio's (India) calendar months, like the entries' dates. */
export const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
export const monthOf = (iso: string) => iso.slice(0, 7);
export const monthName = (ym: string) => new Date(ym + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
export const shiftMonth = (ym: string, n: number) => { const d = new Date(ym + '-01T00:00:00'); d.setMonth(d.getMonth() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };

export const dur = (min: number) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm'; };
export const hours = (min: number) => (Math.round(min / 6) / 10).toString().replace(/\.0$/, '') + ' h';

export const logged = (time: TimeEntry[], ym: string, billableOnly = true) =>
  time.filter(e => !e.running && monthOf(e.workOn) === ym && (!billableOnly || e.billable)).reduce((n, e) => n + e.minutes, 0);

export const TODO_LABEL: Record<Todo['status'], string> = { open: 'Open', progress: 'In progress', review: 'Ready for you', done: 'Done' };
export const needsYou = (t: Todo) => t.status === 'review';
