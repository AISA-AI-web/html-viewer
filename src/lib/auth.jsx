import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({ user: null, loading: true })

// Ensures a row exists in `profiles` for the signed-in user, seeded from the
// OAuth metadata (Google name). Best-effort; failures are non-fatal.
async function ensureProfile(user) {
  if (!user) return
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Teacher'
  await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id', ignoreDuplicates: true })
    .then(() => {}, () => {}) // swallow — RLS/offline shouldn't break the session
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureProfile(session.user)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }, [])

  const signInWithEmail = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = { user, loading, signInWithGoogle, signInWithEmail, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
