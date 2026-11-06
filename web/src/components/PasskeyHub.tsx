'use client';

import { useEffect, useRef, useState } from 'react';
import { Mark } from './ui';
import { assertionJSON, attestationJSON, creationOptions, hubClient, passkeyError, requestOptions, returnWith, safeReturn } from '@/lib/passkey';

/* account.embed.design: the one address where passkey ceremonies run (see
   lib/passkey.ts). Signs in or adds a passkey, then hands the session back to
   the project page that sent the browser here. */
type Mode = 'signin' | 'register';
type Ready = { challengeId: string; options: unknown; expires: number } | null;

export function PasskeyHub() {
  const [mode, setMode] = useState<Mode>('signin');
  const [back, setBack] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const client = useRef(hubClient());

  /* Fetch a challenge now, so the tap can go straight to Face ID / Touch ID. */
  const prepare = async (m: Mode) => {
    setReady(null);
    const api = client.current.auth.passkey;
    const { data, error } = m === 'signin' ? await api.startAuthentication() : await api.startRegistration();
    if (error || !data) { setErr(passkeyError(error)); return; }
    setReady({ challengeId: data.challenge_id, options: data.options, expires: data.expires_at * 1000 });
  };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m: Mode = q.get('mode') === 'register' ? 'register' : 'signin';
    setMode(m);
    const to = safeReturn(q.get('return'));
    setBack(to);
    if (!to) return setErr('This passkey link is incomplete. Go back to your project and try again.');
    if (!window.PublicKeyCredential) return setErr('This browser doesn’t support passkeys. Use the email code instead.');
    (async () => {
      if (m === 'register') {
        const h = new URLSearchParams(window.location.hash.slice(1));
        history.replaceState(null, '', window.location.pathname + window.location.search);
        const at = h.get('at'), rt = h.get('rt');
        if (!at || !rt) return setErr('Sign in to your project first, then add a passkey from Account.');
        const { error } = await client.current.auth.setSession({ access_token: at, refresh_token: rt });
        if (error) return setErr('Your sign-in has expired. Sign in to your project again, then add a passkey.');
      }
      await prepare(m);
    })();
  }, []);

  const go = async () => {
    if (!ready || !back) return;
    if (Date.now() > ready.expires - 5000) { await prepare(mode); return setErr('That took a while, so we refreshed it. Tap again.'); }
    setBusy(true); setErr(null);
    try {
      const api = client.current.auth.passkey;
      if (mode === 'signin') {
        const cred = await navigator.credentials.get({ publicKey: requestOptions(ready.options) }) as PublicKeyCredential;
        const { data, error } = await api.verifyAuthentication({ challengeId: ready.challengeId, credential: assertionJSON(cred) });
        if (error || !data?.session) throw error || new Error('No session came back.');
        returnWith(back, data.session, 'signed-in');
      } else {
        const cred = await navigator.credentials.create({ publicKey: creationOptions(ready.options) }) as PublicKeyCredential;
        const { error } = await api.verifyRegistration({ challengeId: ready.challengeId, credential: attestationJSON(cred) });
        if (error) throw error;
        const { data } = await client.current.auth.getSession();
        if (!data.session) throw new Error('Your sign-in ended. Sign in again.');
        returnWith(back, data.session, 'registered');
      }
    } catch (e) {
      setErr(passkeyError(e));
      setBusy(false);
      prepare(mode);
    }
  };

  const host = back ? new URL(back).hostname : '';
  return (
    <div className="gate">
      <div className="gate-card stack" style={{ gap: 20 }}>
        <div className="gate-lockup"><Mark size={30} /><span>Embed Studios</span></div>
        <h1 style={{ fontSize: 34, lineHeight: 1.05 }}>{mode === 'signin' ? 'Sign in with a passkey' : 'Add a passkey'}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {mode === 'signin'
            ? 'Use Face ID, Touch ID or your device PIN. No code, no password.'
            : 'Save a passkey to this device, or to iCloud Keychain or Google Password Manager, so next time you sign in with Face ID or Touch ID.'}
        </p>
        <button className="btn" disabled={!ready || busy || !back} onClick={go}>
          {busy ? 'Waiting for your device…' : !ready && !err ? 'Getting ready…' : mode === 'signin' ? 'Use my passkey' : 'Create passkey'}
        </button>
        {err && <p className="err" role="alert">{err}</p>}
        {back && <a className="link" href={back}>Back to {host}</a>}
      </div>
    </div>
  );
}
