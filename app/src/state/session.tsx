import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../data/api';

/** undefined while restoring, null when signed out. */
type Session = { email: string | null | undefined; linkError: string | null };

const Ctx = createContext<Session>({ email: undefined, linkError: null });
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.getSessionEmail().then(e => alive && setEmail(e));
    const off = api.onAuthChange(e => setEmail(e));

    // Magic links come back as a deep link (cold start or while running).
    const handle = (url: string | null) => {
      if (!url || !/[?#&](code|access_token|error_description)=/.test(url)) return;
      api.completeSignInFromUrl(url).catch(err => setLinkError(String(err.message ?? err)));
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', e => handle(e.url));
    return () => { alive = false; off(); sub.remove(); };
  }, []);

  return <Ctx.Provider value={{ email, linkError }}>{children}</Ctx.Provider>;
}
