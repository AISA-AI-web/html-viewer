import QRCode from 'qrcode'

// Thin wrappers around node-qrcode. ECC level 'M' (15% recovery) is a good
// default for reliable phone-camera scanning. The QR encodes the simulation's
// share URL (short and robust) by default.

export async function qrToCanvas(canvas, text, opts = {}) {
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 320,
    ...opts,
  })
}

export async function qrToDataURL(text, opts = {}) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 1024,
    ...opts,
  })
}

// Returns the smallest QR version (1-40) that fits `text`, or null if it cannot
// fit in a single QR at the given ECC level. Used to drive the capacity meter
// for the optional offline-embed mode.
export function qrCapacityInfo(text, errorCorrectionLevel = 'M') {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel })
    return { fits: true, version: qr.version }
  } catch {
    return { fits: false, version: null }
  }
}
