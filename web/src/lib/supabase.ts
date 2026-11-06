import { createClient } from '@supabase/supabase-js';

// Public values: the publishable key only ever acts as the signed-in client,
// and row-level security decides what that client can see.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://husbeyvispvucaxbhylp.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_WKB0CYyHejbvdzpibUr4Jg_J-GIxFvd';
const url = SUPABASE_URL, key = SUPABASE_KEY;

// Each subdomain is its own origin, so a session is per project address.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});
