// PUBLIC Supabase configuration.
//
// These two values are SAFE to ship in client-side code. The anon/publishable
// key only grants whatever your Row-Level Security (RLS) policies allow — it is
// not a secret. NEVER put the service_role key here.
//
// They can be overridden at build time via Vite env vars
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), e.g. from GitHub Actions
// repository *Variables*. If unset, the committed defaults below are used.
//
// NOTE: the project URL was derived by decoding the provided key. Confirm it
// matches Supabase → Project Settings → Data API → Project URL.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ojifqcnsvbvkvvpvwmovr.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_87Sk_zzm6QLFeDfi3E_woQ_Kw3rCzyx'
