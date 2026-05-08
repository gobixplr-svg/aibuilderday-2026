// Aerial image acquisition via Google Static Maps API.
// Input: { lat, lng } + options. Output: Buffer (JPEG bytes).
//
// Notes:
// - zoom 20 is the max usable for residential rooftops. Zoom 21 only works in some areas.
// - scale=2 doubles pixel density (returns 1280x1280 for size=640x640) — better detail for vision models.
// - maptype=satellite gives raw satellite imagery (no labels). Use 'hybrid' if labels help.

const STATIC_MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap"

export async function fetchAerial({ lat, lng, zoom = 20, size = 640, scale = 2, maptype = "satellite" }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY missing in environment (.env.local)")
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoom),
    size: `${size}x${size}`,
    scale: String(scale),
    maptype,
    format: "jpg",
    key: apiKey,
  })

  const url = `${STATIC_MAPS_URL}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`[aerial] HTTP ${res.status}: ${detail.slice(0, 200)}`)
  }

  const ct = res.headers.get("content-type") || ""
  if (!ct.startsWith("image/")) {
    const detail = await res.text().catch(() => "")
    throw new Error(`[aerial] expected image, got ${ct}: ${detail.slice(0, 200)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

// Meters per pixel at the equator at a given zoom and scale.
// At latitude > 0, multiply by cos(lat) to correct.
// 156543.03392 meters / 2^zoom pixels at the equator (z0 = whole world in 256px).
export function metersPerPixel({ lat, zoom, scale = 1 }) {
  const eq = 156543.03392 / Math.pow(2, zoom)
  return (eq * Math.cos((lat * Math.PI) / 180)) / scale
}

export function feetPerPixel({ lat, zoom, scale = 1 }) {
  return metersPerPixel({ lat, zoom, scale }) * 3.28084
}
