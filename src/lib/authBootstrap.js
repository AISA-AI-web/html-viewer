import { supabase } from './supabase'

// Completes the OAuth / magic-link redirect *before* React renders.
//
// After sign-in, Supabase sends the browser back to
//   https://aisa-ai-web.github.io/html-viewer/?code=XXXX
// (HashRouter then normalizes it to .../html-viewer/?code=XXXX#/). We must
// trade that one-time `code` for a session. Doing it here — synchronously
// awaited in main.jsx before the router mounts — avoids racing HashRouter and,
// crucially, surfaces failures the library would otherwise swallow.
//
// Returns { error } where error is a human-readable string (or null). Callers
// pass it into the UI so a failed link shows a message instead of a blank,
// silently-logged-out page.
export async function bootstrapAuth() {
  const url = new URL(window.location.href)

  // Auth params normally ride on the query string, but read the hash query too
  // (defensive: some flows / proxies tuck them after the fragment).
  const hashParams = new URLSearchParams(
    url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?') + 1) : ''
  )
  const code = url.searchParams.get('code') || hashParams.get('code')
  const errDesc =
    url.searchParams.get('error_description') || hashParams.get('error_description')

  // Provider-side failures (expired/abused link, access denied) come back as
  // ?error=...&error_description=... with no code.
  if (errDesc) {
    cleanUrl(url)
    return { error: decodeURIComponent(errDesc.replace(/\+/g, ' ')) }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    cleanUrl(url)
    if (error) return { error: error.message }
  }

  return { error: null }
}

// Strip the one-time code/error params so a refresh can't re-trigger a stale
// exchange, and the address bar isn't left showing them.
function cleanUrl(url) {
  url.searchParams.delete('code')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  url.searchParams.delete('error_code')
  window.history.replaceState(
    window.history.state,
    '',
    url.pathname + url.search + (url.hash || '#/')
  )
}
