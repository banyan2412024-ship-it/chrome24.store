// ── Supabase Client ───────────────────────────────────────────────────────────
// Replace these values with your Supabase project credentials
// Project Settings → API in your Supabase dashboard

const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
