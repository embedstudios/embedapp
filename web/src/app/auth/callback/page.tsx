'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sign-in links land here; supabase-js exchanges the ?code= for a session
// (detectSessionInUrl), then the project opens.
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
