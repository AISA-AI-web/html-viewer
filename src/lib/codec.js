import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate'

// Compresses an HTML string and encodes it as a URL-safe payload, and back.
// Used for the optional "offline QR" mode where the HTML travels INSIDE the QR
// (no server lookup). Format: a 1-char version prefix + base64url of raw DEFLATE.
//
// Raw DEFLATE (not gzip) saves the gzip header/CRC bytes — every byte counts
// against the QR's ~2-3 KB ceiling. strToU8/strFromU8 guarantee correct UTF-8
// for arbitrary HTML (emoji, CJK, etc.).

const PREFIX = '1' // '1' = raw-deflate + base64url

function bytesToB64url(bytes) {
  let bin = ''
  const CHUNK = 0x8000 // chunk to avoid String.fromCharCode arg-count limits
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeHtml(html) {
  const compressed = deflateSync(strToU8(html), { level: 9 })
  return PREFIX + bytesToB64url(compressed)
}

export function decodeHtml(payload) {
  if (!payload || payload[0] !== PREFIX) {
    throw new Error('Unrecognized payload format')
  }
  const bytes = b64urlToBytes(payload.slice(1))
  return strFromU8(inflateSync(bytes))
}
