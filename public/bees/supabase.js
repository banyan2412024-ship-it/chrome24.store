// ── Supabase Client ───────────────────────────────────────────────────────────
// Replace these values with your Supabase project credentials
// Project Settings → API in your Supabase dashboard

const SUPABASE_URL = 'https://utlbxmxyhdmhpcpaovqs.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_138OIETL0AkRdrvKlLYXzw_qfG2sH8n'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
