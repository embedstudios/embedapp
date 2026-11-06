import { supabase } from '../lib/supabase';
import { createDemoApi } from './demoApi';
import { createSupabaseApi } from './supabaseApi';
import type { Api } from './types';

export const api: Api = supabase ? createSupabaseApi(supabase) : createDemoApi();
