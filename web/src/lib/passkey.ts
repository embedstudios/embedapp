import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_KEY, SUPABASE_URL } from './supabase';
import { ROOT_DOMAIN } from './tenant';

/* Passkeys (Supabase Auth, experimental).

   Supabase checks every passkey ceremony against at most five allowed
   origins, and every project has its own <sub>.embed.design address, so all
   ceremonies run on one address: account.embed.design (same static app).
   A project page sends the browser there with a return address; the hub runs
   Touch ID / Face ID and sends the session back in the URL *fragment* (never
   sent to any server), where the project page adopts it and wipes it from the
   address bar. The hub only ever returns to https://<project>.embed.design,
   and keeps its own session in memory, never in storage.

   Supabase dashboard: Authentication → Passkeys → enabled, RP ID
   "embed.design", origins "https://account.embed.design". */

export const PASSKEY_HOST = 'account.' + ROOT_DOMAIN;
const HUB = 'https://' + PASSKEY_HOST;

export const isPasskeyHub = () => typeof window !== 'undefined' && window.location.hostname.toLowerCase() === PASSKEY_HOST;
export const passkeysSupported = () => typeof window !== 'undefined' && !!window.PublicKeyCredential;

/** Where the hub may hand a session to: a project's own address only. */
export function safeReturn(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const okProd = u.protocol === 'https:' && host.endsWith('.' + ROOT_DOMAIN) && host !== PASSKEY_HOST && host.split('.').length === ROOT_DOMAIN.split('.').length + 1;
    const okDev = u.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1');
    return okProd || okDev ? u.origin + u.pathname + u.search : null;
  } catch { return null; }
}

/** Send this tab to the hub. `register` carries the current session so the hub can attach a passkey to it. */
export async function goToPasskeyHub(mode: 'signin' | 'register') {
  const back = window.location.origin + window.location.pathname + window.location.search;
  const q = new URLSearchParams({ mode, return: back });
  let hash = '';
  if (mode === 'register') {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Sign in first, then add a passkey.');
    hash = '#' + new URLSearchParams({ at: data.session.access_token, rt: data.session.refresh_token });
  }
  window.location.assign(HUB + '/passkey/?' + q + hash);
}

/** On a project page: adopt a session the hub handed back, then clear it from the address bar. */
export async function adoptHandoff(): Promise<'signed-in' | 'registered' | null> {
  if (typeof window === 'undefined' || !window.location.hash.includes('pk_at=')) return null;
  const h = new URLSearchParams(window.location.hash.slice(1));
  const at = h.get('pk_at'), rt = h.get('pk_rt'), done = h.get('pk_done');
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (!at || !rt) return null;
  const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
  if (error) return null;
  return done === 'registered' ? 'registered' : 'signed-in';
}

/* ---- on the hub -------------------------------------------------------- */
/** A client that never writes the session to storage: the hub only relays it. */
export const hubClient = () => createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

/** Hand a session back to the project page and leave. */
export function returnWith(to: string, s: { access_token: string; refresh_token: string }, done: 'signed-in' | 'registered') {
  window.location.replace(to + '#' + new URLSearchParams({ pk_at: s.access_token, pk_rt: s.refresh_token, pk_done: done }));
}

export function passkeyError(e: unknown): string {
  const err = e as { name?: string; code?: string; message?: string };
  const code = err?.code || '';
  if (err?.name === 'NotAllowedError' || code === 'ERROR_CEREMONY_ABORTED') return 'Passkey cancelled.';
  if (code === 'passkey_disabled') return 'Passkeys aren’t switched on yet. Use the email code for now.';
  if (code === 'webauthn_credential_not_found') return 'That passkey isn’t linked to an Embed account. Sign in with the email code, then add one in Account.';
  if (code === 'webauthn_credential_exists') return 'This device already has a passkey for your account.';
  if (code === 'webauthn_challenge_expired') return 'That took too long. Try again.';
  return err?.message || 'Passkey didn’t work. Try again, or use the email code.';
}

/* ---- WebAuthn JSON <-> browser objects ---------------------------------
   The hub fetches the challenge when it opens and runs the ceremony straight
   from the tap: Safari only allows Face ID / Touch ID inside a user gesture,
   and a network wait first can cost it. So we use Supabase's two-step API and
   convert its standard WebAuthn JSON ourselves. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const toBuf = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0)).buffer;
};
const toB64u = (b: ArrayBuffer | null | undefined) => b ? btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : undefined;

export const requestOptions = (o: any): PublicKeyCredentialRequestOptions => ({
  ...o, challenge: toBuf(o.challenge),
  allowCredentials: (o.allowCredentials || []).map((c: any) => ({ ...c, id: toBuf(c.id) })),
});
export const creationOptions = (o: any): PublicKeyCredentialCreationOptions => ({
  ...o, challenge: toBuf(o.challenge), user: { ...o.user, id: toBuf(o.user.id) },
  excludeCredentials: (o.excludeCredentials || []).map((c: any) => ({ ...c, id: toBuf(c.id) })),
});
export function assertionJSON(c: PublicKeyCredential): any {
  const r = c.response as AuthenticatorAssertionResponse;
  return { id: c.id, rawId: toB64u(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment ?? undefined, clientExtensionResults: c.getClientExtensionResults(),
    response: { clientDataJSON: toB64u(r.clientDataJSON), authenticatorData: toB64u(r.authenticatorData), signature: toB64u(r.signature), userHandle: toB64u(r.userHandle) } };
}
export function attestationJSON(c: PublicKeyCredential): any {
  const r = c.response as AuthenticatorAttestationResponse;
  return { id: c.id, rawId: toB64u(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment ?? undefined, clientExtensionResults: c.getClientExtensionResults(),
    response: { clientDataJSON: toB64u(r.clientDataJSON), attestationObject: toB64u(r.attestationObject), transports: r.getTransports?.() ?? [],
      authenticatorData: r.getAuthenticatorData ? toB64u(r.getAuthenticatorData()) : undefined,
      publicKey: r.getPublicKey ? toB64u(r.getPublicKey()) : undefined, publicKeyAlgorithm: r.getPublicKeyAlgorithm?.() } };
}
