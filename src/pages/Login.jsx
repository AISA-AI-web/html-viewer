import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const { user, authError, signInWithGoogle, signInWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  // Seed from authError so a failed redirect (expired/abused link, missing
  // code-verifier) shows a message instead of a silent logged-out page.
  const [error, setError] = useState(authError || '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function google() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  async function magicLink(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return
    setBusy(true)
    const { error } = await signInWithEmail(email.trim())
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="page narrow center">
      <h1>Sign in</h1>
      <p className="muted">Teachers sign in to publish and rate simulations. Students don't need an account.</p>

      {error && <div className="banner banner--error">{error}</div>}

      <button type="button" className="btn btn--google btn--lg" onClick={google}>
        Continue with Google
      </button>

      <div className="divider"><span>or</span></div>

      {sent ? (
        <div className="banner banner--ok">
          Check your email — we sent a magic sign-in link to <strong>{email}</strong>.
        </div>
      ) : (
        <form className="magic" onSubmit={magicLink}>
          <input
            className="input" type="email" required placeholder="you@school.edu"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a link'}
          </button>
        </form>
      )}
    </div>
  )
}
