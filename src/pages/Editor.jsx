import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { GRADE_LEVELS, SUBJECTS } from '../lib/taxonomy'
import { createSimulation, getSimulation, updateSimulation } from '../lib/db'
import SandboxedHtml from '../components/SandboxedHtml.jsx'
import TagInput from '../components/TagInput.jsx'

const EMPTY = {
  title: '', description: '', grade_level: '', subject: '',
  concepts: [], standards: [], html: '', is_published: true,
}

export default function Editor() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) return
    let active = true
    getSimulation(id)
      .then((sim) => {
        if (!active) return
        setForm({
          title: sim.title || '', description: sim.description || '',
          grade_level: sim.grade_level || '', subject: sim.subject || '',
          concepts: sim.concepts || [], standards: sim.standards || [],
          html: sim.html || '', is_published: sim.is_published,
        })
      })
      .catch((e) => active && setError(e.message || 'Could not load this simulation.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, editing])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Please give it a title.')
    if (!form.html.trim()) return setError('Paste the EduSim HTML before saving.')
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        grade_level: form.grade_level || null,
        subject: form.subject || null,
        concepts: form.concepts,
        standards: form.standards,
        html: form.html,
        is_published: form.is_published,
        author_id: user.id,
      }
      if (editing) {
        await updateSimulation(id, payload)
        navigate(`/sim/${id}`)
      } else {
        const newId = await createSimulation(payload)
        navigate(`/sim/${newId}`)
      }
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="page narrow center">
        <h2>Sign in to add a simulation</h2>
        <p className="muted">You need a teacher account to publish to the hub.</p>
        <Link to="/login" className="btn btn--primary">Sign in</Link>
      </div>
    )
  }

  if (loading) return <div className="page center muted">Loading…</div>

  return (
    <div className="page">
      <h1>{editing ? 'Edit simulation' : 'New simulation'}</h1>
      {error && <div className="banner banner--error">{error}</div>}

      <form className="editor" onSubmit={onSubmit}>
        <div className="editor-cols">
          <div className="editor-form">
            <label className="field">
              <span>Title *</span>
              <input className="input" value={form.title} maxLength={200}
                onChange={(e) => set('title', e.target.value)} placeholder="e.g. Photosynthesis Lab" />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea className="input" rows={2} value={form.description} maxLength={2000}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What students will study, simulate, and be assessed on." />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Grade level</span>
                <select className="input" value={form.grade_level} onChange={(e) => set('grade_level', e.target.value)}>
                  <option value="">—</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Subject</span>
                <select className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)}>
                  <option value="">—</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Concepts</span>
              <TagInput value={form.concepts} onChange={(v) => set('concepts', v)}
                placeholder="Type a concept, press Enter" />
            </label>

            <label className="field">
              <span>Standards</span>
              <TagInput value={form.standards} onChange={(v) => set('standards', v)}
                placeholder="e.g. NGSS MS-LS1-6, press Enter" />
            </label>

            <label className="field">
              <span>EduSim HTML *</span>
              <textarea className="input code" rows={12} value={form.html}
                onChange={(e) => set('html', e.target.value)}
                placeholder="Paste the full HTML you got from EduSim here…" spellCheck={false} />
            </label>

            <label className="checkbox">
              <input type="checkbox" checked={form.is_published}
                onChange={(e) => set('is_published', e.target.checked)} />
              <span>Publish to the library (uncheck to keep as a private draft)</span>
            </label>

            <div className="editor-actions">
              <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish simulation'}
              </button>
            </div>
          </div>

          <div className="editor-preview">
            <div className="preview-label">Live preview</div>
            <div className="preview-frame">
              {form.html.trim()
                ? <SandboxedHtml html={form.html} title="Preview" />
                : <div className="preview-empty">Your simulation will render here as you paste.</div>}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
