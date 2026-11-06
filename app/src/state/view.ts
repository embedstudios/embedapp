// Presentation helpers shared by screens: status pills and navigation.

import { router, type Href } from 'expo-router';
import type { InvoiceStatus } from '../data/types';
import { dayMonth } from '../lib/format';
import { C } from '../theme';

type PillKey =
  | 'pending' | 'review' | 'quoted' | 'reviewing' | 'progress' | 'upcoming' | 'done'
  | 'approved' | 'changes' | 'accepted' | 'declined' | 'paid' | 'scheduled' | 'due';

const PILLS: Record<PillKey, { bg: string; color: string; label: string }> = {
  pending: { bg: C.mintsoft, color: C.mint, label: 'Needs you' },
  review: { bg: C.mintsoft, color: C.mint, label: 'In review' },
  quoted: { bg: C.mintsoft, color: C.mint, label: 'Quote ready' },
  due: { bg: C.warnsoft, color: C.warn, label: 'Due' },
  reviewing: { bg: C.sf2, color: C.mu, label: 'Sizing' },
  progress: { bg: C.sf2, color: C.tx, label: 'In progress' },
  upcoming: { bg: 'transparent', color: C.mu, label: 'Upcoming' },
  done: { bg: C.sf2, color: C.mu, label: 'Done' },
  approved: { bg: C.sf2, color: C.tx, label: 'Approved' },
  changes: { bg: C.warnsoft, color: C.warn, label: 'Changes requested' },
  accepted: { bg: C.sf2, color: C.tx, label: 'Accepted' },
  declined: { bg: C.sf2, color: C.mu, label: 'Declined' },
  paid: { bg: C.sf2, color: C.mu, label: 'Paid' },
  scheduled: { bg: C.sf2, color: C.mu, label: 'Issued today' },
};

export const pill = (k: PillKey) => PILLS[k] ?? PILLS.upcoming;

export const invoicePill = (status: InvoiceStatus, dueOn: string | null) =>
  status === 'due' && dueOn ? { ...PILLS.due, label: 'Due ' + dayMonth(dueOn) } : pill(status);

/** Back, falling back to Home when there's nothing to pop (e.g. after a deep link). */
export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Tab switch: reset the stack, like the prototype's tab(). */
export const goTab = (href: Href) => {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
};

/** "A", "An", "Y": first letter, or two when an earlier teammate already uses that letter. */
export const teamInitial = (name: string, team: { name: string }[]) =>
  team.findIndex(t => t.name[0] === name[0]) < team.findIndex(t => t.name === name) ? name.slice(0, 2) : name[0];
