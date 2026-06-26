import { useRef, useEffect } from 'react'

// Renders UNTRUSTED HTML inside a locked-down iframe.
//
// SECURITY: sandbox="allow-scripts" WITHOUT allow-same-origin forces the framed
// document into a unique *opaque* origin. The pasted page's own JS runs (so the
// simulation works), but it CANNOT:
//   - read window.top / parent.document (Same-Origin Policy blocks it)
//   - read our cookies, localStorage, or the signed-in teacher's Supabase token
//   - make same-origin requests against our app's origin
// We deliberately omit allow-same-origin, allow-top-navigation, allow-popups,
// allow-forms, allow-modals, allow-downloads. The HTML is only ever assigned to
// `srcdoc` — never to innerHTML and never eval'd.
export default function SandboxedHtml({ html, title = 'Simulation', className, style }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) ref.current.srcdoc = html || ''
  }, [html])

  return (
    <iframe
      ref={ref}
      title={title}
      className={className}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      style={{ width: '100%', height: '100%', border: 0, background: '#fff', ...style }}
    />
  )
}
