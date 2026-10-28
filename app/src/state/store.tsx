import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../data/api';
import type { Profile, Project, ProjectDetail } from '../data/types';
import type { Currency } from '../lib/format';

type Store = {
  profile: Profile | null;
  projects: Project[];
  projectId: string | null;
  detail: ProjectDetail | null;
  error: string | null;
  cur: Currency;
  setCur: (c: Currency) => void;
  setNotify: (on: boolean) => void;
  selectProject: (id: string) => void;
  /** Re-reads the project list and the current project's detail. */
  refresh: (projectId?: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
};

type Loaded =
  | { profile: Profile; projects: Project[]; projectId: string | null; detail: ProjectDetail | null }
  | { error: string };

async function fetchAll(id: string | null): Promise<Loaded> {
  try {
    const [profile, projects] = await Promise.all([api.loadProfile(), api.listProjects()]);
    const projectId = projects.some(p => p.id === id) ? id : projects[0]?.id ?? null;
    return { profile, projects, projectId, detail: projectId ? await api.loadProject(projectId) : null };
  } catch (e) {
    return { error: String((e as Error).message ?? e) };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<string | null>(null);

  const apply = useCallback((r: Loaded) => {
    if ('error' in r) return setError(r.error);
    setProfile(prev => prev ?? r.profile);
    setProjects(r.projects);
    current.current = r.projectId;
    setProjectId(r.projectId);
    setDetail(r.detail);
    setError(null);
  }, []);
  const load = useCallback(async (id?: string) => apply(await fetchAll(id ?? current.current)), [apply]);

  useEffect(() => {
    let alive = true;
    fetchAll(null).then(r => alive && apply(r));
    return () => { alive = false; };
  }, [apply]);

  const value = useMemo<Store>(() => ({
    profile, projects, projectId, error,
    // Hide a stale project's detail while the newly selected one loads.
    detail: detail && detail.project.id === projectId ? detail : null,
    cur: profile?.currency ?? 'INR',
    setCur: c => { setProfile(p => (p ? { ...p, currency: c } : p)); api.updateProfile({ currency: c }).catch(() => {}); },
    setNotify: on => { setProfile(p => (p ? { ...p, notify: on } : p)); api.updateProfile({ notify: on }).catch(() => {}); },
    selectProject: id => { current.current = id; setProjectId(id); api.loadProject(id).then(setDetail).catch(e => setError(String(e.message ?? e))); },
    refresh: load,
  }), [profile, projects, projectId, detail, error, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
