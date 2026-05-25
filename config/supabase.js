// config/supabase.js
// Real Supabase project values
const SUPABASE_URL = 'https://jzeezibzydgituzolvrq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ppRxdMfJqma6VVwbffUH0A_fBgEIhf4';

// Initialize Supabase client without redeclaring the global library variable
window.supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);