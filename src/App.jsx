import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import { useAuth } from './lib/auth.jsx'

// App chrome shared by all non-fullscreen routes.
export default function App() {
  const { authError } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="app">
      <Nav />
      {authError && !dismissed && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <div className="banner banner--error">
            Sign-in didn’t complete: {authError}
            <button
              type="button"
              className="btn btn--sm"
              style={{ marginLeft: 12 }}
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>EduSim Hub — interactive simulations built by teachers, for teachers.</span>
      </footer>
    </div>
  )
}
