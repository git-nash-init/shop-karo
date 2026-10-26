import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://sllgtaolsaecchidbnvj.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGd0YW9sc2FlY2NoaWRibnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjk5MjA4MywiZXhwIjoyMTA4NTY4MDgzfQ.FphPvrHt9qq-QuwzQFARQu8kJ5UefpLv74MHFksbNeM';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGd0YW9sc2FlY2NoaWRibnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTIwODMsImV4cCI6MjEwODU2ODA4M30.R9cSvO7B9sRDa9fDLmXfnoB0o5Ej1tnWyM-NRCYnmgA';

// Server-side admin client using service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Factory to create a Supabase client authenticated as a specific user
// (for operations that need to respect RLS with the user's JWT)
const createUserClient = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export { supabaseAdmin, createUserClient };
export default supabaseAdmin;
