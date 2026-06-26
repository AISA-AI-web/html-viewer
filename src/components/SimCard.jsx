import { Link } from 'react-router-dom'
import Stars from './Stars.jsx'

export default function SimCard({ sim, authorName }) {
  return (
    <Link to={`/sim/${sim.id}`} className="card">
      <div className="card-head">
        <h3 className="card-title">{sim.title}</h3>
        <Stars value={Number(sim.avg_rating) || 0} count={sim.rating_count} size={15} />
      </div>
      {sim.description && <p className="card-desc">{sim.description}</p>}
      <div className="card-tags">
        {sim.grade_level && <span className="tag tag--grade">{sim.grade_level}</span>}
        {sim.subject && <span className="tag tag--subject">{sim.subject}</span>}
        {(sim.concepts || []).slice(0, 3).map((c) => (
          <span key={c} className="tag">{c}</span>
        ))}
      </div>
      <div className="card-foot">
        <span>{authorName || 'A teacher'}</span>
        <span>{sim.view_count || 0} views</span>
      </div>
    </Link>
  )
}
