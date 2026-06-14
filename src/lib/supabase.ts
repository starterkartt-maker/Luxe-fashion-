import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://dqhtktvaocnwavvaqzie.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YRszGyFgQsqC1Rc9bzmVqw_rNIWT4PT';

export const supabase = createClient(supabaseUrl, supabaseKey);
