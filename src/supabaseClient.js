import { createClient } from '@supabase/supabase-js';

// User provided keys
const supabaseUrl = 'https://qqfkbymtmaoesigyluuz.supabase.co';
const supabaseAnonKey = 'sb_publishable_hXG-g3aEUtJshMS0Lb2shQ_J_vzM01o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
