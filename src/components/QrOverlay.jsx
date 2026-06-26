import { useEffect, useRef, useState } from 'react'
import { qrToCanvas, qrToDataURL } from '../lib/qr'

// Modal showing a scannable QR for the given URL, plus copy/download actions.
export default function QrOverlay({ url, onClose }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvasRef.current && url) {
      qrToCanvas(canvasRef.current, url, { width: 280 }).catch(() => {})
    }
  }, [url])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard may be blocked; ignore */ }
  }

  async function download() {
    try {
      const dataUrl = await qrToDataURL(url, { width: 1024 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'edusim-qr.png'
      a.click()
    } catch { /* ignore */ }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">Scan to open</h2>
        <p className="modal-sub">Students scan this to run the simulation — no account needed.</p>
        <div className="qr-frame">
          <canvas ref={canvasRef} />
        </div>
        <div className="qr-url" title={url}>{url}</div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" className="btn btn--primary" onClick={download}>
            Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
