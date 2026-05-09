/** Shared Nominatim geocode for hail-leads contractor sources. */

export type GeocodeHit = {
  lat: number
  lon: number
  south: number
  north: number
  west: number
  east: number
}

export function nominatimRequestHeaders(): HeadersInit {
  return {
    "User-Agent":
      process.env.HAIL_USER_AGENT ?? "jobnimbus-hail-leads/1.0 (+https://www.jobnimbus.com)",
  }
}

/** Expand a point into a bbox (south, west, north, east) in degrees. */
export function expandBboxFromCenter(lat: number, lon: number, padDeg: number): GeocodeHit {
  return {
    lat,
    lon,
    south: lat - padDeg,
    north: lat + padDeg,
    west: lon - padDeg,
    east: lon + padDeg,
  }
}

export async function geocodeUsLocality(anchor: string): Promise<GeocodeHit | null> {
  const geoUrl = new URL("https://nominatim.openstreetmap.org/search")
  geoUrl.searchParams.set("q", anchor)
  geoUrl.searchParams.set("format", "jsonv2")
  geoUrl.searchParams.set("limit", "1")
  geoUrl.searchParams.set("countrycodes", "us")
  geoUrl.searchParams.set("addressdetails", "1")

  const geoRes = await fetch(geoUrl, {
    headers: nominatimRequestHeaders(),
    next: { revalidate: 3600 },
  })
  if (!geoRes.ok) return null

  const geoHits = (await geoRes.json()) as Array<{
    lat: string
    lon: string
    boundingbox?: [string, string, string, string]
  }>

  const hit = geoHits[0]
  if (!hit) return null

  const lat = Number(hit.lat)
  const lon = Number(hit.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const bbox = hit.boundingbox
  if (bbox && bbox.length === 4) {
    const [southLat, northLat, westLon, eastLon] = bbox.map(Number)
    return { lat, lon, south: southLat, north: northLat, west: westLon, east: eastLon }
  }

  return expandBboxFromCenter(lat, lon, 0.35)
}
