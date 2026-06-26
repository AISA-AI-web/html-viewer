import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// PKCE flow puts the auth code in the query string (?code=...) rather than the
// URL hash. This is important because we use hash-based routing for GitHub
// Pages — an implicit-flow token in the hash would collide with the router.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
