// Star rating. Read-only display by default; pass onRate to make it interactive.
export default function Stars({ value = 0, count, onRate, size = 18 }) {
  const rounded = Math.round(value)
  const interactive = typeof onRate === 'function'

  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) =>
        interactive ? (
          <button
            key={n}
            type="button"
            className={`star ${n <= rounded ? 'star--on' : ''}`}
            onClick={() => onRate(n)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={`star ${n <= rounded ? 'star--on' : ''}`}>★</span>
        ),
      )}
      {count != null && (
        <span className="stars-count">
          {value ? value.toFixed(1) : '—'}{count ? ` (${count})` : ''}
        </span>
      )}
    </span>
  )
}
