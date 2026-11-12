const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

const authOpts = { persistSession: false, autoRefreshToken: false };

// ADMIN: bypasses RLS. Server-only. Use ONLY for token verification and admin tasks.
// NEVER use it to query user data.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: authOpts });

// Fresh anon client for public auth calls (signup, login, reset). Nothing shared between users.
const createAnonClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: authOpts });

// Per-request client that runs as the user, so RLS applies.
const createUserClient = (token) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: authOpts,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

module.exports = { supabaseAdmin, createAnonClient, createUserClient };