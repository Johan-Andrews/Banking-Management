import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Using service role ONLY because this is an academic project showcasing database interactions and we need absolute permissions for triggers/RPCs, bypassing standard RLS limits.
// DO NOT DO THIS IN A REAL APP EXPOSED TO USERS!
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
