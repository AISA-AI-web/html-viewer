import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSimulations, getAuthorNames } from '../lib/db'
import { GRADE_LEVELS, SUBJECTS } from '../lib/taxonomy'
import SimCard from '../components/SimCard.jsx'

export default function Home() {
  const [filters, setFilters] = useState({ search: '', grade: '', subject: '', sort: 'created_at' })
  const [sims, setSims] = useState([])
  const [authors, setAuthors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const t = setTimeout(() => {
      listSimulations(filters)
        .then(async (rows) => {
          if (!active) return
          setSims(rows)
          setAuthors(await getAuthorNames(rows.map((r) => r.author_id)))
        })
        .catch((e) => active && setError(e.message || 'Could not load the library.'))
        .finally(() => active && setLoading(false))
    }, 250) // debounce search typing
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [filters])

  function set(key, val) {
    setFilters((f) => ({ ...f, [key]: val }))
  }

  return (
    <div className="page">
      <div className="hero-band">
        <h1>Simulation Library</h1>
        <p>Browse interactive learning simulations created by teachers. Find one, open it, share the QR with students.</p>
        <Link to="/new" className="btn btn--primary btn--lg">+ Add a simulation</Link>
      </div>

      <div className="filters">
        <input
          className="input filters-search"
          type="search"
          placeholder="Search by title or description…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
        <select className="input" value={filters.grade} onChange={(e) => set('grade', e.target.value)}>
          <option value="">All grades</option>
          {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="input" value={filters.subject} onChange={(e) => set('subject', e.target.value)}>
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="created_at">Newest</option>
          <option value="rating">Top rated</option>
          <option value="views">Most viewed</option>
        </select>
      </div>

      {error && <div className="banner banner--error">{error}</div>}
      {loading ? (
        <div className="muted center">Loading…</div>
      ) : sims.length === 0 ? (
        <div className="empty">
          <p>No simulations match yet.</p>
          <Link to="/new" className="btn btn--primary">Be the first to add one</Link>
        </div>
      ) : (
        <div className="grid">
          {sims.map((sim) => (
            <SimCard key={sim.id} sim={sim} authorName={authors[sim.author_id]} />
          ))}
        </div>
      )}
    </div>
  )
}
