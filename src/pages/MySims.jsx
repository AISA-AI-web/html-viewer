import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { getMySimulations, deleteSimulation } from '../lib/db'
import Stars from '../components/Stars.jsx'

export default function MySims() {
  const { user, loading: authLoading } = useAuth()
  const [sims, setSims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    getMySimulations(user.id)
      .then((rows) => active && setSims(rows))
      .catch((e) => active && setError(e.message || 'Could not load your simulations.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [user])

  async function onDelete(id) {
    if (!window.confirm('Delete this simulation permanently?')) return
    try {
      await deleteSimulation(id)
      setSims((s) => s.filter((x) => x.id !== id))
    } catch (e) {
      setError(e.message || 'Delete failed.')
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="page narrow center">
        <h2>Sign in to see your simulations</h2>
        <Link to="/login" className="btn btn--primary">Sign in</Link>
      </div>
    )
  }
  if (loading) return <div className="page center muted">Loading…</div>

  return (
    <div className="page">
      <div className="page-head">
        <h1>My simulations</h1>
        <Link to="/new" className="btn btn--primary">+ New</Link>
      </div>
      {error && <div className="banner banner--error">{error}</div>}

      {sims.length === 0 ? (
        <div className="empty">
          <p>You haven't published any simulations yet.</p>
          <Link to="/new" className="btn btn--primary">Create your first</Link>
        </div>
      ) : (
        <table className="mytable">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Rating</th><th>Views</th><th></th></tr>
          </thead>
          <tbody>
            {sims.map((s) => (
              <tr key={s.id}>
                <td><Link to={`/sim/${s.id}`}>{s.title}</Link></td>
                <td>{s.is_published ? <span className="tag tag--subject">Published</span> : <span className="tag">Draft</span>}</td>
                <td><Stars value={Number(s.avg_rating) || 0} count={s.rating_count} size={14} /></td>
                <td>{s.view_count}</td>
                <td className="row-actions">
                  <Link to={`/edit/${s.id}`} className="btn btn--sm">Edit</Link>
                  <button type="button" className="btn btn--sm btn--danger" onClick={() => onDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
