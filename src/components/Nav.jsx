import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Nav() {
  const { user, signOut, loading } = useAuth()

  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        <span className="nav-logo">⚛️</span> EduSim&nbsp;Hub
      </Link>
      <nav className="nav-links">
        <NavLink to="/" end className="nav-link">Library</NavLink>
        {user && <NavLink to="/me" className="nav-link">My Sims</NavLink>}
        {user && <NavLink to="/new" className="nav-link nav-link--cta">+ New</NavLink>}
        {!loading && (user ? (
          <button type="button" className="nav-link nav-btn" onClick={signOut}>
            Sign out
          </button>
        ) : (
          <NavLink to="/login" className="nav-link nav-link--cta">Sign in</NavLink>
        ))}
      </nav>
    </header>
  )
}
