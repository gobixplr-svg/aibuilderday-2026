// Free geocoding (Census → Nominatim) + Esri World Imagery tiles.
// Same outputs as fetch-aerial-free.mjs; shared by aerial-pipeline when no Google key.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
const ESRI_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile"

async function geocodeCensus(address) {
  const url = `${CENSUS_URL}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`[geocode-census] HTTP ${res.status}`)
  const body = await res.json()
  const match = body?.result?.addressMatches?.[0]
  if (!match) throw new Error(`[geocode-census] no results`)
  return {
    input_address: address,
    formatted_address: match.matchedAddress,
    place_id: String(match.tigerLine?.tigerLineId || ""),
    lat: Number(match.coordinates.y),
    lng: Number(match.coordinates.x),
    location_type: "residential",
    source: "census",
  }
}

async function geocodeNominatim(address) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "AIBuilderDay2026/0.1 (hackathon stand-in)" },
  })
  if (!res.ok) throw new Error(`[geocode-nominatim] HTTP ${res.status}`)
  const arr = await res.json()
  if (!arr.length) throw new Error(`[geocode-nominatim] no results`)
  const top = arr[0]
  return {
    input_address: address,
    formatted_address: top.display_name,
    place_id: String(top.place_id),
    lat: Number(top.lat),
    lng: Number(top.lon),
    location_type: top.osm_type,
    source: "nominatim",
  }
}

export async function geocodeFree(address) {
  try {
    return await geocodeCensus(address)
  } catch (censusErr) {
    console.log(`[geocode] Census missed: ${censusErr.message}; trying Nominatim`)
    try {
      return await geocodeNominatim(address)
    } catch (nomErr) {
      throw new Error(`Census + Nominatim both failed: ${censusErr.message} / ${nomErr.message}`)
    }
  }
}

function lngToTileX(lng, z) {
  return ((lng + 180) / 360) * Math.pow(2, z)
}
function latToTileY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z)
}

export async function fetchEsriComposite({ lat, lng, zoom = 19 }) {
  const txF = lngToTileX(lng, zoom)
  const tyF = latToTileY(lat, zoom)
  const TILES = 4
  const baseX = Math.floor(txF) - Math.floor(TILES / 2)
  const baseY = Math.floor(tyF) - Math.floor(TILES / 2)

  let sharp
  try {
    sharp = (await import("sharp")).default
  } catch {
    const tx = Math.floor(txF)
    const ty = Math.floor(tyF)
    const url = `${ESRI_TILE_URL}/${zoom}/${ty}/${tx}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`[aerial] HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return { buffer: buf, width: 256, height: 256, zoom, tileMode: "single" }
  }

  const tiles = []
  for (let dy = 0; dy < TILES; dy++) {
    for (let dx = 0; dx < TILES; dx++) {
      const tx = baseX + dx
      const ty = baseY + dy
      tiles.push({ dx, dy, url: `${ESRI_TILE_URL}/${zoom}/${ty}/${tx}` })
    }
  }
  const fetched = await Promise.all(
    tiles.map(async (t) => {
      const res = await fetch(t.url)
      if (!res.ok) throw new Error(`[aerial] tile ${t.url} → HTTP ${res.status}`)
      return { ...t, buffer: Buffer.from(await res.arrayBuffer()) }
    })
  )

  const fullSize = TILES * 256
  const composite = await sharp({
    create: { width: fullSize, height: fullSize, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite(fetched.map((f) => ({ input: f.buffer, top: f.dy * 256, left: f.dx * 256 })))
    .jpeg({ quality: 92 })
    .toBuffer()

  const pxInComposite = {
    x: (txF - baseX) * 256,
    y: (tyF - baseY) * 256,
  }

  const TARGET = 640
  const left = Math.max(0, Math.min(fullSize - TARGET, Math.round(pxInComposite.x - TARGET / 2)))
  const top = Math.max(0, Math.min(fullSize - TARGET, Math.round(pxInComposite.y - TARGET / 2)))
  const cropped = await sharp(composite).extract({ left, top, width: TARGET, height: TARGET }).jpeg({ quality: 92 }).toBuffer()

  return { buffer: cropped, width: TARGET, height: TARGET, zoom, tileMode: "composite" }
}
