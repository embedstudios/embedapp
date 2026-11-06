'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { brandCard, listProjects, loadDetail, loadProfile, subscribeMessages, updateProfile, type Detail, type Profile, type Project } from '@/lib/data';
import { playChat } from '@/lib/sound';
import { adoptHandoff } from '@/lib/passkey';
import { supabase } from '@/lib/supabase';
import { currentSubdomain } from '@/lib/tenant';
import { loadFx } from '@/lib/fx';
import type { Currency } from '@/lib/format';

/** Where this tab is: which gate is showing, or the project is ready. */
export type Gate = 'loading' | 'signed-out' | 'not-found' | 'no-access' | 'picker' | 'ready';
type Toast = { text: string; undo?: () => void } | null;

type App = {
  gate: Gate;
  sub: string | null;
  brand: { name: string; subtitle: string } | null;
  session: Session | null;
  profile: Profile | null;
  projects: Project[];
  detail: Detail | null;
  error: string | null;
  cur: Currency;
  setCur: (c: Currency) => void;
  setNotify: (on: boolean) => void;
  refresh: () => Promise<void>;
  toast: (text: string, undo?: () => void) => void;
  /** The full-screen check moment (1.4s), then resolves. */
  celebrate: (title: string, tag: string, sub: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Bumps when live exchange rates arrive, so converted figures re-render. */
  fxTick: number;
};

const Ctx = createContext<App | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [sub, setSub] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [brand, setBrand] = useState<App['brand']>(null);
  const [brandChecked, setBrandChecked] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastState, setToast] = useState<Toast>(null);
  const [cele, setCele] = useState<{ title: string; tag: string; sub: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /* Today's exchange rates, for converted amounts; re-render once they land. */
  const [fxTick, setFxTick] = useState(0);
  useEffect(() => { loadFx().then(() => setFxTick(n => n + 1)); }, []);

  // The subdomain is only known in the browser.
  useEffect(() => {
    const s = currentSubdomain();
    setSub(s);
    setResolved(true);
    if (s) brandCard(s).then(b => setBrand(b), () => setBrand(null)).finally(() => setBrandChecked(true));
    else setBrandChecked(true);
  }, []);

  /* A session handed back from the passkey address (account.embed.design) is adopted first. */
  const [handoff, setHandoff] = useState<'signed-in' | 'registered' | null>(null);
  useEffect(() => {
    adoptHandoff().then(r => { setHandoff(r); return supabase.auth.getSession(); }).then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [p, list] = await Promise.all([loadProfile(), listProjects()]);
      setProfile(p);
      setProjects(list);
      const mine = sub ? list.find(x => x.subdomain === sub) : null;
      setDetail(mine ? await loadDetail(mine.id) : null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, [session, sub]);

  useEffect(() => { if (resolved && session) load(); }, [resolved, session, load]);

  const toast = useCallback((text: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setToast({ text, undo });
    timer.current = setTimeout(() => setToast(null), undo ? 7000 : 3500);
  }, []);

  /* A team reply while the client is elsewhere in the portal: chime and a toast.
     The Messages page plays its own sound, so stay quiet there. */
  const projectId = detail?.project.id;
  useEffect(() => {
    if (!projectId) return;
    return subscribeMessages(projectId, m => {
      if (m.fromClient || window.location.pathname.startsWith('/messages')) return;
      playChat('receive');
      toast(m.authorName + ': ' + (m.body.length > 70 ? m.body.slice(0, 70) + '…' : m.body));
    }, 'global');
  }, [projectId, toast]);

  useEffect(() => {
    if (handoff) toast(handoff === 'registered' ? 'Passkey added. Next time, sign in with Face ID or Touch ID.' : 'Signed in with your passkey.');
  }, [handoff, toast]);

  const celebrate = useCallback((title: string, tag: string, subLine: string) => new Promise<void>(resolve => {
    setCele({ title, tag, sub: subLine });
    setTimeout(() => { setCele(null); resolve(); }, 1400);
  }), []);

  let gate: Gate = 'loading';
  if (resolved && brandChecked && session !== undefined) {
    if (sub && !brand) gate = 'not-found';
    else if (!session) gate = 'signed-out';
    else if (!loaded) gate = 'loading';
    else if (!sub) gate = 'picker';
    else gate = detail ? 'ready' : 'no-access';
  }

  const value = useMemo<App>(() => ({
    gate, sub, brand, session: session ?? null, profile, projects, detail, error,
    cur: profile?.currency ?? 'INR',
    setCur: c => { setProfile(p => (p ? { ...p, currency: c } : p)); updateProfile({ currency: c }).catch(() => {}); },
    setNotify: on => { setProfile(p => (p ? { ...p, notify: on } : p)); updateProfile({ notify: on }).catch(() => {}); },
    refresh: load,
    toast,
    celebrate,
    signOut: async () => { await supabase.auth.signOut(); setProfile(null); setDetail(null); setLoaded(false); },
    fxTick,
  }), [gate, sub, brand, session, profile, projects, detail, error, load, toast, celebrate, fxTick]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {cele && <Celebrate {...cele} />}
      {toastState && (
        <div className="toast" role="status">
          <span>{toastState.text}</span>
          {toastState.undo && <button onClick={() => { clearTimeout(timer.current); setToast(null); toastState.undo?.(); }}>Undo</button>}
        </div>
      )}
    </Ctx.Provider>
  );
}

const BURST = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, r = 74 + (i % 3) * 20;
  return { glyph: i % 2 ? '>' : '<', size: 13 + (i % 3) * 4, color: i % 3 === 0 ? 'var(--tx)' : 'var(--mint)', dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r), rot: (i % 2 ? 1 : -1) * (40 + i * 15) };
});

function Celebrate({ title, tag, sub }: { title: string; tag: string; sub: string }) {
  return (
    <div className="celebrate" role="status" aria-live="polite">
      <div style={{ position: 'relative' }}>
        {BURST.map((b, i) => (
          <span key={i} className="burst" style={{ fontSize: b.size, color: b.color, ['--dx' as string]: b.dx + 'px', ['--dy' as string]: b.dy + 'px', ['--rot' as string]: b.rot + 'deg' }}>{b.glyph}</span>
        ))}
        <div className="celebrate-check">
          <svg width="46" height="46" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M10 23l8 8 16-18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <h2>{title}</h2>
      <span className="tag">{'<' + tag + '> '}<b>{sub}</b>{' </' + tag + '>'}</span>
    </div>
  );
}
