// config/database.php
// Real Supabase project values
const SUPABASE_URL = 'https://jzeezibzydgituzolvrq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ppRxdMfJqma6VVwbffUH0A_fBgEIhf4';

// Initialize Supabase client without redeclaring the global library variable
window.supabaseClient = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is authenticated
async function checkAuth() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  return user;
}

// Logout user
async function logout() {
  const { error } = await window.supabaseClient.auth.signOut();
  if (!error) {
    window.location.href = 'login.html';
  }
  return error;
}

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  return user;
}

// Protect admin pages
async function protectAdminPage() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = 'login.html';
  }
  return user;
}