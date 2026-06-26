import { useState } from 'react'

// Free-text tag entry: type a value, press Enter or comma to add a chip.
export default function TagInput({ value = [], onChange, placeholder, max = 20 }) {
  const [draft, setDraft] = useState('')

  function addTag(raw) {
    const tag = raw.trim()
    if (!tag) return
    if (value.length >= max) return
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="taginput">
      {value.map((tag) => (
        <span key={tag} className="chip">
          {tag}
          <button type="button" className="chip-x" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
            ×
          </button>
        </span>
      ))}
      <input
        className="taginput-field"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length ? '' : placeholder}
      />
    </div>
  )
}
