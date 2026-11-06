'use client';

import { PasskeyHub } from './PasskeyHub';
import { goToPasskeyHub, isPasskeyHub, passkeysSupported } from '@/lib/passkey';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { PHASE_NAMES } from '@/lib/data';
import { greeting } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { projectHref, ROOT_DOMAIN } from '@/lib/tenant';
import { useApp } from './AppProvider';
import type { IconName } from './icon-data';
import { Icon, Mark, Meta, Tag } from './ui';

const NAV: { href: string; label: string; short: string; icon: IconName; count?: (d: NonNullable<ReturnType<typeof useApp>['detail']>) => number }[] = [
  { href: '/', label: 'Overview', short: 'Home', icon: 'EssentialsHome' },
  { href: '/phases/', label: 'Phases & files', short: 'Phases', icon: 'InterfaceGridLayout' },
  { href: '/approvals/', label: 'Approvals', short: 'Approvals', icon: 'BasicsTick', count: d => d.approvals.filter(a => a.status === 'pending').length },
  { href: '/scope/', label: 'Scope & quotes', short: 'Scope', icon: 'BasicsPlusCircle', count: d => d.requests.filter(r => r.status === 'quoted').length },
  { href: '/billing/', label: 'Billing', short: 'Billing', icon: 'EssentialsBookmark', count: d => d.invoices.filter(i => i.status === 'due').length },
  { href: '/messages/', label: 'Messages', short: 'Chat', icon: 'EssentialsChat' },
  { href: '/account/', label: 'Account', short: 'You', icon: 'EssentialsUserCircle' },
];

export function Shell({ children }: { children: ReactNode }) {
  const app = useApp();
  /* Known only in the browser; deciding after mount keeps hydration identical. */
  const [hub, setHub] = useState(false);
  useEffect(() => { setHub(isPasskeyHub()); }, []);
  if (hub) return <PasskeyHub />;
  if (app.gate === 'loading') return <div className="gate-center"><span className="spinner" aria-label="Loading" /></div>;
  if (app.gate === 'not-found') return <NotFound />;
  if (app.gate === 'signed-out') return <SignIn />;
  if (app.gate === 'no-access') return <NoAccess />;
  if (app.gate === 'picker') return <Picker />;
  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: ReactNode }) {
  const { detail, profile, projects, sub } = useApp();
  const path = usePathname();
  const d = detail!;
  const others = projects.filter(p => p.subdomain && p.subdomain !== sub);
  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          <span className="side-initial">{d.project.name[0]}</span>
          <span>
            <strong>{d.project.name}</strong>
            <small>{d.project.subtitle}</small>
          </span>
        </div>
        <div className="side-phase">
          <span className="eyebrow">{d.project.status === 'proposal' ? 'Proposal in progress' : d.project.status === 'complete' ? 'Complete' : <Meta parts={['Phase ' + (['research', 'strategy', 'ideation', 'design', 'handover'].indexOf(d.project.currentPhase) + 1) + ' of 5', PHASE_NAMES[d.project.currentPhase]]} />}</span>
          <span className="bar"><i style={{ width: (d.project.status === 'proposal' ? 0 : d.project.progress) + '%' }} /></span>
        </div>
        <nav className="nav" aria-label="Project">
          {NAV.map(n => {
            const on = n.href === '/' ? path === '/' : path.startsWith(n.href.replace(/\/$/, ''));
            const c = n.count ? n.count(d) : 0;
            return (
              <Link key={n.href} href={n.href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
                <Icon name={n.icon} size={18} />
                <span className="nav-long">{n.label}</span>
                <span className="nav-short">{n.short}</span>
                {c > 0 && <em>{c}</em>}
              </Link>
            );
          })}
        </nav>
        {others.length > 0 && (
          <div className="side-others">
            <span className="eyebrow">Your other projects</span>
            {others.map(p => <a key={p.id} href={projectHref(p.subdomain!)}>{p.name} <small>{p.subdomain}.{ROOT_DOMAIN}</small></a>)}
          </div>
        )}
        <div className="side-foot">
          <Mark size={18} />
          <span>Embed Studios<small>{profile?.email}</small></span>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

/* ---- gates ------------------------------------------------------------------ */

function GateFrame({ children, brandName }: { children: ReactNode; brandName?: string }) {
  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-lockup">
          <Mark size={30} />
          {brandName && <><span className="gate-x">×</span><strong>{brandName}</strong></>}
        </div>
        {children}
      </div>
    </div>
  );
}

function SignIn() {
  const { brand, sub } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(v)) return setErr('Enter the email your project invite was sent to.');
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({ email: v, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + '/auth/callback/' } });
    setBusy(false);
    if (error) {
      setErr(/signup|not allowed|not found/i.test(error.message) ? 'We couldn’t find an invite for that email. Ask your Embed project lead to add you.'
        : /rate limit|security purposes|seconds/i.test(error.message) ? 'A code was sent recently. Use the latest email, or try again in a minute.'
        : 'Couldn’t send the code. Check your connection and try again.');
      return;
    }
    setSentTo(v); setCode('');
  };
  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = code.replace(/\D/g, '');
    if (!sentTo || c.length < 6) return setErr('Enter the code from the email.');
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: c, type: 'email' });
    setBusy(false);
    if (error) setErr(/expired|invalid/i.test(error.message) ? 'That code is wrong or has expired. Check the latest email, or send a new one.' : 'Couldn’t check the code. Try again.');
  };

  return (
    <GateFrame brandName={brand?.name}>
      <h1 className="gate-h">{brand ? <>Your project,<br />always in <em>view</em>.</> : <>Your Embed<br />projects.</>}</h1>
      <p className="gate-sub"><Tag tag="hi">{brand ? `${brand.subtitle || brand.name} — progress, approvals, quotes and invoices in one place` : 'We embed user experience with your digital products'}</Tag><i className="caret" /></p>
      {!sentTo ? (
        <form onSubmit={send} className="stack">
          <label className="field">
            <span>Work email</span>
            <input type="email" autoComplete="email" autoFocus value={email} onChange={e => { setEmail(e.target.value); setErr(null); }} placeholder="you@company.com" />
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in code'}</button>
          {passkeysSupported() && <>
            <div className="or" aria-hidden="true"><span>or</span></div>
            <button type="button" className="btn btn-ghost" onClick={() => goToPasskeyHub('signin')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 20a7 7 0 0 1 11.5-5.4" /><circle cx="18" cy="14" r="2.5" /><path d="M18 16.5V22M18 19.5h2" /></svg>
              Sign in with a passkey
            </button>
          </>}
          <p className="hint center">No password. Access is by invite from your Embed project lead{sub ? <> for <b>{sub}.{ROOT_DOMAIN}</b></> : null}.</p>
        </form>
      ) : (
        <form onSubmit={verify} className="stack">
          <div className="notice"><b>Check your inbox.</b> We sent a code to {sentTo}. Enter it here, or open the link in the email.</div>
          <label className="field">
            <span>Code</span>
            <input className="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} autoFocus value={code} onChange={e => { setCode(e.target.value); setErr(null); }} placeholder="123456" />
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="hint center">
            <button type="button" className="link" onClick={() => send()}>Send a new code</button><span aria-hidden="true" className="vr" /><button type="button" className="link" onClick={() => { setSentTo(null); setErr(null); }}>Use a different email</button>
          </p>
        </form>
      )}
    </GateFrame>
  );
}

function NotFound() {
  const { sub } = useApp();
  return (
    <GateFrame>
      <h1 className="gate-h">Nothing here yet.</h1>
      <p className="gate-sub">There’s no project at <b>{sub}.{ROOT_DOMAIN}</b>. Check the address your Embed project lead sent you, or write to <b>hello@embed.design</b>.</p>
    </GateFrame>
  );
}

function NoAccess() {
  const { brand, profile, signOut } = useApp();
  return (
    <GateFrame brandName={brand?.name}>
      <h1 className="gate-h">You’re signed in, but not to this project.</h1>
      <p className="gate-sub">{profile?.email} doesn’t have access to {brand?.name}. Ask your Embed project lead to add you, or sign in with the email they invited.</p>
      <button className="btn btn-ghost" onClick={signOut}>Sign in with another email</button>
    </GateFrame>
  );
}

function Picker() {
  const { projects, profile, signOut } = useApp();
  const name = profile?.fullName.split(' ')[0];
  return (
    <GateFrame>
      <h1 className="gate-h">{greeting()}{name ? ', ' + name : ''}.</h1>
      <p className="gate-sub">Open a project to see its progress, approvals and invoices.</p>
      <div className="picker">
        {projects.map(p => p.subdomain ? (
          <a key={p.id} href={projectHref(p.subdomain)} className="picker-row">
            <span className="side-initial">{p.name[0]}</span>
            <span><strong>{p.name}</strong><small>{p.subdomain}.{ROOT_DOMAIN}</small></span>
            <Icon name="BasicsRightSmall" size={18} />
          </a>
        ) : (
          <div key={p.id} className="picker-row muted">
            <span className="side-initial">{p.name[0]}</span>
            <span><strong>{p.name}</strong><small>{p.status === 'proposal' ? 'Proposal in progress' : 'Web address coming soon'}</small></span>
          </div>
        ))}
        {!projects.length && <p className="hint">No projects yet. Your Embed project lead will add you to one.</p>}
      </div>
      <button className="link" onClick={signOut}>Sign out</button>
    </GateFrame>
  );
}
