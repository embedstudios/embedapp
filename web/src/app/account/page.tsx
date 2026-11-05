'use client';

import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { updateProfile } from '@/lib/data';
import { projectHref, ROOT_DOMAIN } from '@/lib/tenant';

export default function Account() {
  const { profile, projects, sub, cur, setCur, setNotify, signOut, refresh, toast } = useApp();
  const [name, setName] = useState(profile?.fullName || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [busy, setBusy] = useState(false);
  const dirty = name !== (profile?.fullName || '') || title !== (profile?.title || '');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await updateProfile({ fullName: name.trim(), title: title.trim() }); await refresh(); toast('Saved.'); }
    catch (err) { toast((err as Error).message); }
    setBusy(false);
  };

  return (
    <div className="page">
      <div className="page-head"><div><h1>Account</h1><p>{profile?.email}</p></div></div>
      <div className="cols-even cols">
        <form className="card stack" onSubmit={save}>
          <span className="eyebrow">Profile</span>
          <label className="field"><span>Name</span><input value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="field"><span>Role</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="VP Product" /></label>
          <div className="actions"><button className="btn btn-sm" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
        <div className="card stack">
          <span className="eyebrow">Preferences</span>
          <div className="section-head"><span>Show amounts in</span><span className="seg">{(['INR', 'USD'] as const).map(c => <button key={c} aria-pressed={cur === c} onClick={() => setCur(c)}>{c}</button>)}</span></div>
          <label className="section-head" style={{ cursor: 'pointer' }}>
            <span>Email me when something needs me<br /><small className="muted">Approvals, quotes and invoices — never progress noise</small></span>
            <input type="checkbox" checked={!!profile?.notify} onChange={e => setNotify(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--mint)' }} />
          </label>
        </div>
      </div>
      <section className="section">
        <span className="eyebrow">Your projects</span>
        <div className="card card-flush">
          {projects.map(p => (
            <a key={p.id} className="row" href={p.subdomain ? projectHref(p.subdomain) : undefined} aria-current={p.subdomain === sub}>
              <span className="side-initial" style={{ width: 32, height: 32, fontSize: 14 }}>{p.name[0]}</span>
              <span className="grow"><strong>{p.name}</strong><small>{p.subdomain ? p.subdomain + '.' + ROOT_DOMAIN : p.status === 'proposal' ? 'Proposal in progress' : 'Web address coming soon'}</small></span>
              {p.subdomain === sub ? <small>You’re here</small> : p.subdomain ? <span className="link">Open</span> : null}
            </a>
          ))}
        </div>
      </section>
      <div className="actions">
        <a className="btn btn-quiet btn-sm" href="mailto:hello@embed.design">hello@embed.design</a>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
