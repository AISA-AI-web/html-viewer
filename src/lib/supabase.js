import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// PKCE flow puts the auth code in the query string (?code=...) rather than the
// URL hash. This is important because we use hash-based routing for GitHub
// Pages — an implicit-flow token in the hash would collide with the router.
//
// detectSessionInUrl is OFF on purpose: we exchange the code ourselves in
// bootstrapAuth() *before* the router mounts. The library's auto-exchange runs
// at import time and (a) races HashRouter, and (b) swallows failures (a failed
// exchange is returned internally, never thrown), which left users stuck on a
// silent logged-out page. Manual exchange makes the result observable.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})
