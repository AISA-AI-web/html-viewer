import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { getSimulation, incrementView, getMyRating, rateSimulation, getAuthorNames, getSimulationStats } from '../lib/db'
import SandboxedHtml from '../components/SandboxedHtml.jsx'
import QrOverlay from '../components/QrOverlay.jsx'
import Stars from '../components/Stars.jsx'

export default function Viewer() {
  const { id } = useParams()
  const { user } = useAuth()
  const [sim, setSim] = useState(null)
  const [author, setAuthor] = useState('')
  const [error, setError] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [myRating, setMyRating] = useState(null)

  useEffect(() => {
    let active = true
    setError('')
    getSimulation(id)
      .then(async (data) => {
        if (!active) return
        setSim(data)
        incrementView(id)
        const names = await getAuthorNames([data.author_id])
        if (active) setAuthor(names[data.author_id] || 'A teacher')
      })
      .catch((e) => active && setError(e.message || 'This simulation could not be found.'))
    return () => { active = false }
  }, [id])

  useEffect(() => {
    let active = true
    if (sim && user) getMyRating(sim.id, user.id).then((r) => active && setMyRating(r))
    return () => { active = false }
  }, [sim, user])

  const onRate = useCallback(async (n) => {
    if (!user || !sim) return
    setMyRating(n)
    try {
      await rateSimulation(sim.id, user.id, n)
      // Refresh only the aggregates — don't re-fetch html (it would reset the iframe).
      const fresh = await getSimulationStats(sim.id)
      if (fresh) setSim((s) => ({ ...s, ...fresh }))
    } catch { /* keep optimistic value */ }
  }, [user, sim])

  const shareUrl = `${window.location.origin}${window.location.pathname}#/sim/${id}`

  if (error) {
    return (
      <div className="viewer-msg">
        <h2>Hmm.</h2>
        <p className="muted">{error}</p>
        <Link to="/" className="btn btn--primary">Back to library</Link>
      </div>
    )
  }
  if (!sim) return <div className="viewer-msg muted">Loading simulation…</div>

  return (
    <div className="viewer">
      <SandboxedHtml html={sim.html} title={sim.title} className="viewer-frame" />

      <div className="viewer-bar">
        <Link to="/" className="vb-btn" title="Library">←</Link>
        <span className="vb-title">{sim.title}</span>
        <div className="vb-spacer" />
        <button type="button" className="vb-btn" onClick={() => setShowInfo((v) => !v)} title="Details">ⓘ</button>
        <button type="button" className="vb-btn vb-btn--primary" onClick={() => setShowQr(true)}>
          ⬚ QR
        </button>
      </div>

      {showInfo && (
        <div className="viewer-info">
          <button type="button" className="modal-close" onClick={() => setShowInfo(false)} aria-label="Close">×</button>
          <h3>{sim.title}</h3>
          {sim.description && <p>{sim.description}</p>}
          <div className="info-meta">
            {sim.grade_level && <span className="tag tag--grade">{sim.grade_level}</span>}
            {sim.subject && <span className="tag tag--subject">{sim.subject}</span>}
            {(sim.concepts || []).map((c) => <span key={c} className="tag">{c}</span>)}
          </div>
          {(sim.standards || []).length > 0 && (
            <p className="info-standards"><strong>Standards:</strong> {sim.standards.join(', ')}</p>
          )}
          <p className="muted">By {author} · {sim.view_count} views</p>
          <div className="info-rating">
            <Stars value={Number(sim.avg_rating) || 0} count={sim.rating_count} />
          </div>
          {user ? (
            <div className="info-rate">
              <span>Your rating:</span>
              <Stars value={myRating || 0} onRate={onRate} />
            </div>
          ) : (
            <p className="muted"><Link to="/login">Sign in</Link> to rate this simulation.</p>
          )}
        </div>
      )}

      {showQr && <QrOverlay url={shareUrl} onClose={() => setShowQr(false)} />}
    </div>
  )
}
