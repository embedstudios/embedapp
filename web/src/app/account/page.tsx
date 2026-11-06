'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { goToPasskeyHub, passkeyError, passkeysSupported } from '@/lib/passkey';
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
      <Passkeys />
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

/* Passkeys on this account (Supabase Auth). Adding one runs on account.embed.design
   (lib/passkey.ts); listing and removing work from here. */
type Pk = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };
function Passkeys() {
  const { toast } = useApp();
  const [keys, setKeys] = useState<Pk[] | null>(null);
  const [supported, setSupported] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const load = () => supabase.auth.passkey.list().then(({ data, error }) => { if (error) { setErr(passkeyError(error)); setKeys([]); } else setKeys(data || []); });
  useEffect(() => { setSupported(passkeysSupported()); load(); }, []);
  const day = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const remove = async (k: Pk) => {
    if (!confirm('Remove the passkey “' + (k.friendly_name || 'Passkey') + '”? You can still sign in with an email code.')) return;
    const { error } = await supabase.auth.passkey.delete({ passkeyId: k.id });
    if (error) return toast(passkeyError(error));
    toast('Passkey removed.'); load();
  };
  return (
    <section className="section">
      <span className="eyebrow">Passkeys</span>
      <div className="card stack">
        <p style={{ margin: 0 }}>Sign in with Face ID, Touch ID or your device PIN instead of an email code. A passkey saved to iCloud Keychain or Google Password Manager works on your other devices too, for every Embed project you’re on.</p>
        {keys === null ? <span className="spinner" /> : keys.length ? (
          <div className="card card-flush">
            {keys.map(k => (
              <div key={k.id} className="row">
                <span className="grow"><strong>{k.friendly_name || 'Passkey'}</strong><small>Added {day(k.created_at)}{k.last_used_at ? ', last used ' + day(k.last_used_at) : ''}</small></span>
                <button className="link" onClick={() => remove(k)}>Remove</button>
              </div>
            ))}
          </div>
        ) : <p className="hint" style={{ margin: 0 }}>No passkeys yet.</p>}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="actions">
          {supported ? <button className="btn btn-sm" onClick={() => goToPasskeyHub('register').catch(e => toast(passkeyError(e)))}>Add a passkey</button>
            : <p className="hint" style={{ margin: 0 }}>This browser doesn’t support passkeys.</p>}
        </div>
      </div>
    </section>
  );
}
